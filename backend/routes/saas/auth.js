const express    = require('express');
const router     = express.Router();
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const Stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/authTenant');
const ConsentRecord = require('../../models/ConsentRecord');

// ── Регистрация (gopublica self-service) ──────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, companyName, vatId, termsAccepted, privacyAccepted, marketingConsent } = req.body;

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
    });

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