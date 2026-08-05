const express    = require('express');
const router     = express.Router();
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const Stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TenantUser = require('../../models/TenantUser');
const auth = require('../../middleware/auth');
const authTenant = require('../../middleware/authTenant');
const checkRole = require('../../middleware/checkRole');
const ConsentRecord = require('../../models/ConsentRecord');
const { ensureTenantSettings } = require('../../services/tenantBootstrap');

const ADMIN = ['admin', 'superadmin'];

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.passwordHash;
  return obj;
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
    const customer = await Stripe.customers.create({
      email,
      name: companyName || name,
      phone,
    });

    if (vatId) {
      await Stripe.customers.createTaxId(customer.id, {
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

    // ── Фиксация согласий ─────────────────────────────────
    const consents = { terms: false, privacy: false, marketing: false };
    if (termsAccepted) {
      consents.terms = true;
      await ConsentRecord.create({ userId: user._id, type: 'terms', granted: true, ip: req.ip, userAgent: req.get('User-Agent') });
    }
    if (privacyAccepted) {
      consents.privacy = true;
      await ConsentRecord.create({ userId: user._id, type: 'privacy', granted: true, ip: req.ip, userAgent: req.get('User-Agent') });
    }
    if (marketingConsent !== undefined) {
      consents.marketing = marketingConsent;
      await ConsentRecord.create({ userId: user._id, type: 'marketing', granted: marketingConsent, ip: req.ip, userAgent: req.get('User-Agent') });
    }
    user.consents = {
      ...consents,
      lastUpdated: new Date()
    };
    await user.save();

    const token = jwt.sign(
      { userId: user._id, tenantId: null, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

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

// ── Логин (один эндпоинт для обоих флоу) ─────────────────────
router.post('/login', async (req, res) => {
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

    const token = jwt.sign(
      { userId: user._id, tenantId: user.tenantId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

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
    const users = await TenantUser.find().select('-passwordHash').sort({ createdAt: -1 });
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

// ── Текущий пользователь ──────────────────────────────────────
router.get('/me', authTenant, async (req, res) => {
  try {
    const user = await TenantUser.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'Не найден' });
    res.json({
      ...user.toObject(),
      consents: user.consents,   // передаём согласия в ответе
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