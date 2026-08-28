const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const BranchSection = require('../../models/BranchSection');
const Branch = require('../../models/Branch');
const JobApplication = require('../../models/JobApplication');
const TenantSettings = require('../../models/TenantSettings');

// ── Multer config (reused from jobsPublic.js) ─────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Только PDF, DOC, DOCX'), false);
  },
});

// ── Lightweight in-memory rate limiter (no external dependency) ──────
// Sliding-window counter keyed by IP + sectionId. 5 submissions per 60s.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
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
router.post('/:sectionId/submit', rateLimit, upload.any(), async (req, res) => {
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
        const uploaded = (req.files || []).find(f => f.fieldname === field.id);
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

    // Attach uploaded files by field id
    const files = {};
    for (const file of req.files || []) {
      files[file.fieldname] = `/uploads/resumes/${file.filename}`;
    }

    const application = new JobApplication({
      tenantId,
      branchId,
      sourceSectionId: section._id,
      fields: fieldsMap,
      resumeUrl: files.resume || '',
      status: 'new',
    });
    await application.save();

    console.log(
      `📩 Новая заявка из формы "${section._id}" для тенанта ${tenantId}`
    );

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