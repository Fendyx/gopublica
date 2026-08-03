// backend/routes/public/demoRequests.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const DemoRequest = require('../../models/DemoRequest');
const auth = require('../../middleware/auth');
const checkRole = require('../../middleware/checkRole');
const { notifyNewDemoRequest } = require('../../services/adminNotification');

const router = express.Router();

const ADMIN_ROLES = ['admin', 'superadmin'];

// ── Rate limiter for public submissions ─────────────────────────────
// 5 submissions per 15 minutes per IP — enough for legit users,
// blocks brute-force / spam.
const demoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many demo requests from this IP. Please try again later.' },
});

// ── Helpers / validation ────────────────────────────────────────────
const CONTACT_METHODS = ['phone', 'whatsapp', 'telegram'];
const TELEGRAM_HANDLE_RE = /^@?[A-Za-z0-9_]{5,32}$/;

/**
 * Validate the public demo-request payload.
 * Returns `{ ok: true }` or `{ ok: false, message }`.
 */
function validatePayload(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Invalid payload' };
  }

  const { businessType, goals, contactMethod, contact, consentAccepted } = body;

  // Consent
  if (consentAccepted !== true) {
    return { ok: false, message: 'Consent is required' };
  }

  // Business type: preset XOR custom
  const bt = businessType || {};
  const hasPreset = typeof bt.preset === 'string' && bt.preset.trim();
  const hasCustom = typeof bt.custom === 'string' && bt.custom.trim();
  if (!hasPreset && !hasCustom) {
    return { ok: false, message: 'Business type is required' };
  }

  // Goals: at least one preset or a custom value
  const g = goals || {};
  const hasPresetGoals = Array.isArray(g.preset) && g.preset.length > 0;
  const hasCustomGoal = typeof g.custom === 'string' && g.custom.trim();
  if (!hasPresetGoals && !hasCustomGoal) {
    return { ok: false, message: 'At least one goal is required' };
  }

  // Contact method
  if (!CONTACT_METHODS.includes(contactMethod)) {
    return { ok: false, message: 'Invalid contact method' };
  }

  // Contact details
  const c = contact || {};
  if (typeof c.name !== 'string' || c.name.trim().length < 2) {
    return { ok: false, message: 'Name is required (min 2 chars)' };
  }

  if (contactMethod === 'phone') {
    if (!c.phone || !String(c.phone).trim()) {
      return { ok: false, message: 'Phone is required for phone contact' };
    }
    if (!c.preferredLanguage || !String(c.preferredLanguage).trim()) {
      return { ok: false, message: 'Preferred language is required for phone contact' };
    }
    if (!c.bestTimeToCall || !String(c.bestTimeToCall).trim()) {
      return { ok: false, message: 'Best time to call is required for phone contact' };
    }
  }

  if (contactMethod === 'whatsapp') {
    if (!c.phone || !String(c.phone).trim()) {
      return { ok: false, message: 'Phone is required for WhatsApp contact' };
    }
  }

  if (contactMethod === 'telegram') {
    const handle = typeof c.telegramHandle === 'string' ? c.telegramHandle.trim() : '';
    if (!handle || !TELEGRAM_HANDLE_RE.test(handle)) {
      return { ok: false, message: 'Valid Telegram handle is required (5–32 chars, letters/digits/underscore)' };
    }
  }

  return { ok: true };
}

// ── POST /api/public/demo-requests ──────────────────────────────────
// Public, rate-limited. Creates a new DemoRequest and notifies the team.
router.post('/', demoLimiter, async (req, res) => {
  try {
    const validation = validatePayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const {
      businessType,
      goals,
      contactMethod,
      contact,
      locale,
      source,
      consentAccepted,
    } = req.body;

    const doc = await DemoRequest.create({
      businessType: {
        preset: businessType?.preset?.trim() || null,
        custom: businessType?.custom?.trim() || null,
      },
      goals: {
        preset: Array.isArray(goals?.preset) ? goals.preset : [],
        custom: goals?.custom?.trim() || null,
      },
      contactMethod,
      contact: {
        name: contact.name.trim(),
        phone: contact.phone?.trim() || '',
        telegramHandle: contact.telegramHandle?.trim() || '',
        preferredLanguage: contact.preferredLanguage?.trim() || '',
        bestTimeToCall: contact.bestTimeToCall?.trim() || '',
      },
      locale: typeof locale === 'string' ? locale : 'en',
      source: typeof source === 'string' && source ? source : 'website-demo-funnel',
      consentAccepted: !!consentAccepted,
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || req.socket?.remoteAddress || '',
    });

    // Fire-and-forget notification — never block the response on it.
    notifyNewDemoRequest(doc).catch((err) => {
      console.error('notifyNewDemoRequest error:', err.message);
    });

    res.status(201).json({
      _id: doc._id,
      status: doc.status,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error('POST /api/public/demo-requests error:', err);
    res.status(500).json({ message: 'Error saving demo request', error: err.message });
  }
});

// ── GET /api/public/demo-requests ────────────────────────────────────
// Admin-only. Lists all demo requests, newest first.
router.get('/', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const items = await DemoRequest.find({})
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching demo requests', error: err.message });
  }
});

// ── GET /api/public/demo-requests/:id ────────────────────────────────
// Admin-only. Fetch a single demo request.
router.get('/:id', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const item = await DemoRequest.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: 'Demo request not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching demo request', error: err.message });
  }
});

// ── PATCH /api/public/demo-requests/:id ──────────────────────────────
// Admin-only. Update status (New → Contacted → Converted → Rejected).
router.patch('/:id', auth, checkRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { status, convertedToLead } = req.body;
    const update = {};
    if (typeof status === 'string') update.status = status;
    if (convertedToLead !== undefined) update.convertedToLead = convertedToLead || null;

    const updated = await DemoRequest.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: 'Demo request not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Error updating demo request', error: err.message });
  }
});

module.exports = router;
