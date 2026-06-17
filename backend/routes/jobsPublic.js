const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const JobApplication = require('../models/JobApplication');
const JobFormSettings = require('../models/JobFormSettings');
const TenantSettings = require('../models/TenantSettings');

// Настройка multer для загрузки резюме
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
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Только PDF, DOC, DOCX'), false);
  },
});

// GET /api/public/jobs/settings
router.get('/settings', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const tenant = await TenantSettings.findOne({ tenantId }).select('features');
    if (!tenant || !tenant.features?.hasJobApplications) {
      return res.status(404).json({ error: 'Модуль заявок отключён' });
    }

    let settings = await JobFormSettings.findOne({ tenantId });
    if (!settings) {
      const defaultFields = [
{
          id: 'fullName',
          label: 'Full Name',
          labelI18n: { pl: 'Imię i nazwisko', de: 'Vollständiger Name', ru: 'ФИО' },
          type: 'text',
          required: true,
          placeholder: 'John Doe',
          placeholderI18n: { pl: 'Jan Kowalski', de: 'Max Mustermann', ru: 'Иванов Иван Иванович' },
          order: 0,
        },
        {
          id: 'email',
          label: 'Email',
          labelI18n: { pl: 'Email', de: 'E-Mail', ru: 'Email' },
          type: 'email',
          required: true,
          placeholder: 'john@example.com',
          placeholderI18n: { pl: 'jan@example.com', de: 'max@example.com', ru: 'ivan@example.com' },
          order: 1,
        },
        {
          id: 'phone',
          label: 'Phone number',
          labelI18n: { pl: 'Numer telefonu', de: 'Telefonnummer', ru: 'Телефон' },
          type: 'tel',
          required: true,
          placeholder: '+1 555 123-4567',
          placeholderI18n: { pl: '+48 792 123-456', de: '+49 170 1234567', ru: '+7 999 123-45-67' },
          order: 2,
        },
        {
          id: 'position',
          label: 'Desired position',
          labelI18n: { pl: 'Pożądane stanowisko', de: 'Angestrebte Position', ru: 'Желаемая должность' },
          type: 'text',
          required: false,
          placeholder: 'Chef Cook',
          placeholderI18n: { pl: 'Szef kuchni', de: 'Küchenchef', ru: 'Шеф-повар' },
          order: 3,
        },
        {
          id: 'coverLetter',
          label: 'Cover letter',
          labelI18n: { pl: 'List motywacyjny', de: 'Anschreiben', ru: 'Сопроводительное письмо' },
          type: 'textarea',
          required: false,
          placeholder: 'Tell us about yourself...',
          placeholderI18n: { pl: 'Opowiedz o sobie...', de: 'Erzählen Sie uns von sich...', ru: 'Расскажите о себе...' },
          order: 4,
        },
        {
          id: 'resume',
          label: 'Resume (PDF, DOC)',
          labelI18n: { pl: 'CV (PDF, DOC)', de: 'Lebenslauf (PDF, DOC)', ru: 'Резюме (PDF, DOC)' },
          type: 'file',
          required: true,
          order: 5,
        },
      ];
      settings = new JobFormSettings({ tenantId, fields: defaultFields, isActive: true });
      await settings.save();
    }

    // Возвращаем объект целиком, включая все поля I18n
    res.json(settings);
  } catch (err) {
    console.error('Error fetching job settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/jobs/apply
router.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const tenantId = req.body.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const tenant = await TenantSettings.findOne({ tenantId }).select('features email');
    if (!tenant || !tenant.features?.hasJobApplications) {
      return res.status(403).json({ error: 'Модуль заявок отключён для этого тенанта' });
    }

    const settings = await JobFormSettings.findOne({ tenantId });
    if (!settings || !settings.isActive) {
      return res.status(403).json({ error: 'Форма заявок не активна' });
    }

    // Извлекаем поля. На фронте мы отправляем текстовые поля в req.body.fields как JSON-строку
    let formData = {};
    if (req.body.fields) {
        try {
            formData = JSON.parse(req.body.fields);
        } catch(e) {
            console.error("Failed to parse fields", e);
        }
    } else {
        // Fallback, если фронтенд отправляет поля напрямую в body
        const { branchId, tenantId: _tid, ...rest } = req.body;
        formData = rest;
    }


    const requiredFields = settings.fields.filter(f => f.required);
    for (const field of requiredFields) {
      if (field.type === 'file') {
        if (!req.file) return res.status(400).json({ error: `Поле "${field.label}" обязательно` });
        continue;
      }
      const value = formData[field.id];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return res.status(400).json({ error: `Поле "${field.label}" обязательно` });
      }
    }

    const fieldsMap = new Map();
    for (const [key, value] of Object.entries(formData)) {
      fieldsMap.set(key, value);
    }

    let resumeUrl = '';
    if (req.file) {
      resumeUrl = `/uploads/resumes/${req.file.filename}`;
    }

    const application = new JobApplication({
      tenantId,
      branchId: req.body.branchId || null,
      fields: fieldsMap,
      resumeUrl,
      status: 'new',
    });
    await application.save();

    console.log(`📩 Новая заявка от ${formData.fullName || 'Аноним'} для тенанта ${tenantId}`);

    // Получаем корректное сообщение об успехе на нужном языке (опционально: можно передавать locale с фронта, 
    // но проще оставить это фронту - возвращаем базовое сообщение, фронт сам покажет нужное)
    res.status(201).json({
      success: true,
      message: 'Заявка отправлена!', 
    });
  } catch (err) {
    console.error('Error submitting job application:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;