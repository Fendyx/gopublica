const express = require('express');
const router = express.Router();
const { resumeUpload } = require('../../middleware/common/upload');
const BranchSection = require('../../models/BranchSection');
const Branch = require('../../models/Branch');
const JobApplication = require('../../models/hr/JobApplication');
const TenantSettings = require('../../models/TenantSettings');
const { writeConsentLog } = require('../../services/consent/writeConsent');

// ── Lightweight in-memory rate limiter (no external dependency) ──────
// Sliding-window counter keyed by IP + sectionId. 5 submissions per 60s.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map();

function rateLimit(req, res, next) {
  const ip = req.consentContext?.ip || req.ip || 'unknown';
  const sectionId = req.params.sectionId || 'unknown';
  const key = `${ip}:${sectionId}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { windowStart: now, count: 1 });
    return next();
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil(
      (entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000
    );
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'Слишком много попыток. Пожалуйста, попробуйте позже.',
    });
  }

  return next();
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Coerce a value to a string. Returns '' for null/undefined.
 */
function coerceString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

/**
 * POST /api/public/forms/:sectionId/submit
 *
 * Submits a dynamic_form section. Mirrors the job application flow:
 *   - loads the BranchSection by id, verifies type + isActive
 *   - validates required fields against section.settings.fields
 *   - stores the submission as a JobApplication with sourceSectionId
 */
router.post('/:sectionId/submit', rateLimit, resumeUpload.single('resume'), async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Load the section — this also implicitly resolves the tenant (no body tenantId trusted)
    const section = await BranchSection.findById(sectionId).lean();
    if (!section) {
      return res.status(404).json({ error: 'Форма не найдена' });
    }
    if (section.type !== 'dynamic_form') {
      return res.status(400).json({ error: 'Эта секция не является формой' });
    }
    if (!section.isActive) {
      return res.status(403).json({ error: 'Форма отключена' });
    }

    const tenantId = section.tenantId;
    const branchId = section.branchId;

    // Optional tenant-level gate (consistent with jobs flow)
    const tenant = await TenantSettings.findOne({ tenantId }).select('features');
    if (!tenant || !tenant.features?.hasJobApplications) {
      return res.status(403).json({ error: 'Модуль форм отключён для этого тенанта' });
    }

    // Parse submitted fields. Frontend sends text fields as a JSON string in `fields`.
    let formData = {};
    if (req.body.fields) {
      try {
        formData = JSON.parse(req.body.fields);
      } catch {
        return res.status(400).json({ error: 'Неверный формат данных формы' });
      }
    } else {
      // Fallback: fields sent directly in the body
      const { tenantId: _tid, ...rest } = req.body;
      formData = rest;
    }

    const fields = section.settings.fields || [];

    // Validate required fields against the section schema
    for (const field of fields) {
      if (!field.required) continue;

      if (field.type === 'file') {
        const uploaded = req.file && req.file.fieldname === field.id ? req.file : null;
        if (!uploaded) {
          return res.status(400).json({ error: `Поле "${field.label}" обязательно` });
        }
        continue;
      }

      const value = formData[field.id];
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return res.status(400).json({ error: `Поле "${field.label}" обязательно` });
      }
    }

    // Build the fields Map (same shape as JobApplication)
    const fieldsMap = new Map();
    for (const [key, value] of Object.entries(formData)) {
      fieldsMap.set(key, value);
    }

    // Attach uploaded file by field id
    const files = {};
    if (req.file) {
      files[req.file.fieldname] = `/uploads/resumes/${req.file.filename}`;
    }

    // Parse consent from FormData (sent as JSON string)
    let consents = null;
    if (req.body.consents) {
      try { consents = JSON.parse(req.body.consents); } catch {}
    }

    const application = new JobApplication({
      tenantId,
      branchId,
      sourceSectionId: section._id,
      fields: fieldsMap,
      resumeUrl: files.resume || '',
      status: 'new',
    });

    // ── GDPR: Record consent (best-effort — never block application) ──
    if (consents) {
      try {
        application._consent = await writeConsentLog({
          entityType: 'JobApplication',
          entityId: application._id,
          tenantId,
          consents,
          context: req.consentContext,
        });
      } catch (consentErr) {
        console.error('⚠️ Consent logging failed for FormSubmission:', consentErr.message);
      }
    }

    await application.save();

    console.log(
      `📩 Новая заявка из формы "${section._id}" для тенанта ${tenantId}`
    );

    // Fire-and-forget tenant Telegram notification
    require('../../services/notifications/tenantTelegram')
      .notifyNewPartnerRequest(tenantId, branchId, application)
      .catch(err => console.error('Tenant Telegram partner request notification failed:', err.message));

    res.status(201).json({
      success: true,
      message: 'Заявка отправлена!',
    });
  } catch (err) {
    console.error('Error submitting form:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;