const express    = require('express');
const router     = express.Router();
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const bcrypt     = require('bcryptjs');
const rateLimit  = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const { createCustomer, createTaxId } = require('../../services/payments/stripe');
const TenantUser = require('../../models/TenantUser');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const auth = require('../../middleware/auth/jwt');
const authTenant = require('../../middleware/auth/tenant');
const checkRole = require('../../middleware/auth/role');
const ConsentRecord = require('../../models/payments/ConsentRecord');
const { ensureTenantSettings } = require('../../services/tenant/bootstrap');
const { writeConsentLog } = require('../../services/consent/writeConsent');

const ADMIN = ['admin', 'superadmin'];

// ── Security constants ─────────────────────────────────────────────────────
const ACCESS_TOKEN_EXPIRY = '30d';
const REFRESH_LEEWAY_MS  = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
const JWT_SECRET = process.env.JWT_SECRET;

// Rate limiter: max 10 refresh attempts per IP per 15 minutes
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток обновления токена. Попробуйте позже.' },
});

// Rate limiter: max 20 login attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Попробуйте позже.' },
});

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.passwordHash;
  return obj;
}

/**
 * Sign a JWT with unique jti (JWT ID) for audit trail.
 * The jti is a cryptographically random UUID v4.
 */
function signToken(payload) {
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

// ── Регистрация (gopublica self-service) ──────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, companyName, vatId, termsAccepted, privacyAccepted, marketingConsent, tenantId, niche } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password и name обязательны' });
    }

    const existing = await TenantUser.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Создаём Stripe Customer с именем компании (или физлица)
    const customer = await createCustomer({
      email,
      name: companyName || name,
      phone,
    });

    if (vatId) {
      await createTaxId(customer.id, {
        type: 'eu_vat',
        value: vatId,
      });
    }

    const user = await TenantUser.create({
      email,
      passwordHash:    await bcrypt.hash(password, 10),
      name,
      phone:           phone || '',
      companyName:     companyName || '',
      vatId:           vatId || '',
      stripeCustomerId: customer.id,
      tenantId:        tenantId || null,
    });

    // ── Автоматическое создание базовых TenantSettings ──────────────
    if (user.tenantId) {
      try {
        await ensureTenantSettings({
          tenantId: user.tenantId,
          businessName: user.companyName || user.name,
          niche: niche || 'beauty',
          phone: user.phone,
          email: user.email,
        });
      } catch (settingsErr) {
        console.error('⚠️ Failed to create TenantSettings:', settingsErr.message);
      }
    }

    // ── Фиксация согласий (via shared GDPR utility) ──────────
    const consents = { terms: false, privacy: false, marketing: false };
    if (termsAccepted) consents.terms = true;
    if (privacyAccepted) consents.privacy = true;
    if (marketingConsent !== undefined) consents.marketing = marketingConsent;

    user.consents = { ...consents, lastUpdated: new Date() };

    // Unified GDPR consent logging (replaces manual ConsentRecord.create calls)
    await writeConsentLog({
      entityType: 'TenantUser',
      entityId: user._id,
      tenantId: user.tenantId || 'gopublica',
      userId: user._id,
      consents,
      context: req.consentContext,
    });

    await user.save();

    const token = signToken({ userId: user._id, tenantId: null, role: user.role });

    res.status(201).json({
      token,
      user: {
        id:                 user._id,
        email:              user.email,
        name:               user.name,
        phone:              user.phone,
        companyName:        user.companyName,
        vatId:              user.vatId,
        tenantId:           user.tenantId,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan:   user.subscriptionPlan,
        consents:           user.consents,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Google OAuth login/register ──────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential, tenantId } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'credential is required' });
    }

    // 1. Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    if (!email) {
      return res.status(400).json({ error: 'Google account has no email' });
    }

    // 2. Find existing user by googleId or email (scoped by tenantId if provided)
    const query = tenantId
      ? { $or: [{ googleId }, { email }], tenantId }
      : { $or: [{ googleId }, { email }] };
    let user = await TenantUser.findOne(query);

    if (!user) {
      // ── New user: create via Google ──────────────────────────
      // Create Stripe customer
      let stripeCustomerId = null;
      try {
        const customer = await createCustomer({
          email,
          name: name || email,
        });
        stripeCustomerId = customer.id;
      } catch (stripeErr) {
        console.error('⚠️ Google OAuth: failed to create Stripe customer:', stripeErr.message);
      }

      user = await TenantUser.create({
        googleId,
        email,
        name: name || '',
        avatarUrl: picture || '',
        passwordHash: null,
        tenantId: tenantId || null,
        stripeCustomerId,
        consents: { terms: true, privacy: true, marketing: false, lastUpdated: new Date() },
      });
    } else {
      // ── Existing user: link Google account if not yet linked ──
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && !user.avatarUrl) {
        user.avatarUrl = picture;
      }
      if (!user.name && name) {
        user.name = name;
      }
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is blocked' });
    }

    // 3. Issue the same JWT as the password login
    const token = signToken({ userId: user._id, tenantId: user.tenantId, role: user.role });

    res.json({
      token,
      mustChangePassword: false,
      user: {
        id:                 user._id,
        email:              user.email,
        name:               user.name,
        phone:              user.phone,
        companyName:        user.companyName,
        vatId:              user.vatId,
        tenantId:           user.tenantId,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan:   user.subscriptionPlan,
        currentPeriodEnd:   user.currentPeriodEnd,
        avatarUrl:          user.avatarUrl,
        consents:           user.consents,
      },
    });
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// ── Логин (один эндпоинт для обоих флоу) ─────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email и password обязательны' });
    }

    const query = tenantId ? { email, tenantId } : { email };
    const user  = await TenantUser.findOne(query);

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    const token = signToken({ userId: user._id, tenantId: user.tenantId, role: user.role });

    res.json({
      token,
      mustChangePassword: user.mustChangePassword,
      user: {
        id:                 user._id,
        email:              user.email,
        name:               user.name,
        phone:              user.phone,
        companyName:        user.companyName,
        vatId:              user.vatId,
        tenantId:           user.tenantId,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan:   user.subscriptionPlan,
        currentPeriodEnd:   user.currentPeriodEnd,
        consents:           user.consents,   // <-- теперь возвращаем согласия
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Список пользователей для админки ────────────────────────
router.get('/users', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const users = await TenantUser.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Создание пользователя админом ───────────────────────────
router.post('/users', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const { email, password, name, phone, companyName, vatId, role, isActive, tenantId, niche } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password и name обязательны' });
    }

    const existing = await TenantUser.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    const customer = await Stripe.customers.create({
      email,
      name: companyName || name,
      phone,
    });

    if (vatId) {
      await Stripe.customers.createTaxId(customer.id, { type: 'eu_vat', value: vatId });
    }

    const user = await TenantUser.create({
      email,
      passwordHash: await bcrypt.hash(password, 10),
      name,
      phone: phone || '',
      companyName: companyName || '',
      vatId: vatId || '',
      stripeCustomerId: customer.id,
      role: role || 'client_admin',
      isActive: isActive !== undefined ? isActive : true,
      tenantId: tenantId || null,
    });

    // ── Автоматическое создание базовых TenantSettings ──────────────
    if (user.tenantId) {
      try {
        await ensureTenantSettings({
          tenantId: user.tenantId,
          businessName: user.companyName || user.name,
          niche: niche || 'beauty',
          phone: user.phone,
          email: user.email,
        });
      } catch (settingsErr) {
        console.error('⚠️ Failed to create TenantSettings:', settingsErr.message);
      }
    }

    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Обновление пользователя админом ─────────────────────────
router.put('/users/:id', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const update = {};
    if (req.body.email !== undefined) update.email = req.body.email;
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.phone !== undefined) update.phone = req.body.phone;
    if (req.body.companyName !== undefined) update.companyName = req.body.companyName;
    if (req.body.vatId !== undefined) update.vatId = req.body.vatId;
    if (req.body.role !== undefined) update.role = req.body.role;
    if (req.body.isActive !== undefined) update.isActive = req.body.isActive;
    if (req.body.tenantId !== undefined) update.tenantId = req.body.tenantId;
    if (req.body.subscriptionStatus !== undefined) update.subscriptionStatus = req.body.subscriptionStatus;
    if (req.body.subscriptionPlan !== undefined) update.subscriptionPlan = req.body.subscriptionPlan;

    if (req.body.password) {
      update.passwordHash = await bcrypt.hash(req.body.password, 10);
    }

    const user = await TenantUser.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Деактивация пользователя админом ────────────────────────
router.delete('/users/:id', auth, checkRole(ADMIN), async (req, res) => {
  try {
    const user = await TenantUser.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ message: 'Пользователь деактивирован', user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Текущий пользователь (с валидацией токена) ────────────────
router.get('/me', authTenant, async (req, res) => {
  try {
    const user = await TenantUser.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'Не найден' });
    if (!user.isActive) return res.status(403).json({ error: 'Аккаунт заблокирован' });
    res.json({
      ...user.toObject(),
      consents: user.consents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Обновление токена (token refresh) ────────────────────────
// POST /api/saas/auth/refresh
// Accepts the current (possibly expired) JWT, validates it with leeway,
// checks user is still active, and issues a fresh token.
// Rate-limited to 10 attempts per IP per 15 minutes.
router.post('/refresh', refreshLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    // 1. Decode the token WITHOUT expiry check
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    } catch {
      return res.status(401).json({ error: 'Недействительный токен' });
    }

    // 2. Check the token is not older than REFRESH_LEEWAY_MS (30 days)
    //    This prevents abuse of very old tokens.
    const tokenAge = Date.now() - (decoded.iat * 1000);
    if (tokenAge > REFRESH_LEEWAY_MS) {
      return res.status(401).json({ error: 'Токен слишком старый. Войдите заново.' });
    }

    // 3. Verify the user still exists and is active
    const user = await TenantUser.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
    if (!user.isActive) return res.status(403).json({ error: 'Аккаунт заблокирован' });

    // 4. Issue a fresh token with new jti and renewed expiry
    const newToken = signToken({
      userId:   user._id,
      tenantId: user.tenantId,
      role:     user.role,
    });

    res.json({
      token: newToken,
      user: {
        id:                 user._id,
        email:              user.email,
        name:               user.name,
        phone:              user.phone,
        companyName:        user.companyName,
        vatId:              user.vatId,
        tenantId:           user.tenantId,
        role:               user.role,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan:   user.subscriptionPlan,
        currentPeriodEnd:   user.currentPeriodEnd,
        consents:           user.consents,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Смена пароля ──────────────────────────────────────────────
router.post('/change-password', authTenant, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await TenantUser.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Не найден' });

    const isValid = await user.comparePassword(oldPassword);
    if (!isValid) return res.status(400).json({ error: 'Неверный старый пароль' });

    user.passwordHash       = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Пароль изменён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;