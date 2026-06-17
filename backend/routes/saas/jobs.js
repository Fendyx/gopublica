const express = require('express');
const router = express.Router();
const JobApplication = require('../../models/JobApplication');
const JobFormSettings = require('../../models/JobFormSettings');
const TenantSettings = require('../../models/TenantSettings');
const authTenant = require('../../middleware/authTenant');

// ---- Заявки ----

// Получить список заявок (с пагинацией, фильтром по статусу, сортировкой)
router.get('/applications', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { page = 1, limit = 20, status } = req.query;

    // Проверяем, включена ли функция
    const tenant = await TenantSettings.findOne({ tenantId }).select('features');
    if (!tenant || !tenant.features?.hasJobApplications) {
      return res.status(403).json({ error: 'Модуль заявок отключён' });
    }

    const query = { tenantId };
    if (status) query.status = status;

    const total = await JobApplication.countDocuments(query);
    const applications = await JobApplication.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: err.message });
  }
});

// Получить детали одной заявки
router.get('/applications/:id', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const application = await JobApplication.findOne({ _id: req.params.id, tenantId });
    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить статус (и/или комментарий)
router.put('/applications/:id', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { status, comment } = req.body;
    const application = await JobApplication.findOne({ _id: req.params.id, tenantId });
    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    if (status) application.status = status;
    if (comment !== undefined) application.comment = comment;
    await application.save();
    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Настройки формы ----

// Получить настройки (для админки)
router.get('/settings', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    let settings = await JobFormSettings.findOne({ tenantId });
    if (!settings) {
      // Создаём дефолтные настройки на английском с переводами для PL и DE
      const defaultFields = [
        {
          id: 'fullName',
          label: 'Full Name',
          labelI18n: { pl: 'Imię i nazwisko', de: 'Vollständiger Name' },
          type: 'text',
          required: true,
          placeholder: 'John Doe',
          placeholderI18n: { pl: 'Jan Kowalski', de: 'Max Mustermann' },
          order: 0,
        },
        {
          id: 'email',
          label: 'Email',
          labelI18n: { pl: 'Email', de: 'E-Mail' },
          type: 'email',
          required: true,
          placeholder: 'john@example.com',
          placeholderI18n: { pl: 'jan@example.com', de: 'max@example.com' },
          order: 1,
        },
        {
          id: 'phone',
          label: 'Phone number',
          labelI18n: { pl: 'Numer telefonu', de: 'Telefonnummer' },
          type: 'tel',
          required: true,
          placeholder: '+1 555 123-4567',
          placeholderI18n: { pl: '+48 792 123-456', de: '+49 170 1234567' },
          order: 2,
        },
        {
          id: 'position',
          label: 'Desired position',
          labelI18n: { pl: 'Pożądane stanowisko', de: 'Angestrebte Position' },
          type: 'text',
          required: false,
          placeholder: 'Chef Cook',
          placeholderI18n: { pl: 'Szef kuchni', de: 'Küchenchef' },
          order: 3,
        },
        {
          id: 'coverLetter',
          label: 'Cover letter',
          labelI18n: { pl: 'List motywacyjny', de: 'Anschreiben' },
          type: 'textarea',
          required: false,
          placeholder: 'Tell us about yourself...',
          placeholderI18n: { pl: 'Opowiedz o sobie...', de: 'Erzählen Sie uns von sich...' },
          order: 4,
        },
        {
          id: 'resume',
          label: 'Resume (PDF, DOC)',
          labelI18n: { pl: 'CV (PDF, DOC)', de: 'Lebenslauf (PDF, DOC)' },
          type: 'file',
          required: true,
          order: 5,
        },
      ];
      settings = new JobFormSettings({
        tenantId,
        fields: defaultFields,
        isActive: true,
      });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить настройки формы (конструктор полей)
router.put('/settings', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { 
      fields, 
      title, 
      titleI18n,
      description, 
      descriptionI18n,
      submitButtonText, 
      submitButtonTextI18n,
      successMessage, 
      successMessageI18n,
      notificationEmail, 
      isActive 
    } = req.body;

    const updateData = {
      ...(fields !== undefined && { fields }),
      ...(title !== undefined && { title }),
      ...(titleI18n !== undefined && { titleI18n }),
      ...(description !== undefined && { description }),
      ...(descriptionI18n !== undefined && { descriptionI18n }),
      ...(submitButtonText !== undefined && { submitButtonText }),
      ...(submitButtonTextI18n !== undefined && { submitButtonTextI18n }),
      ...(successMessage !== undefined && { successMessage }),
      ...(successMessageI18n !== undefined && { successMessageI18n }),
      ...(notificationEmail !== undefined && { notificationEmail }),
      ...(isActive !== undefined && { isActive }),
    };

    const settings = await JobFormSettings.findOneAndUpdate(
      { tenantId },
      { $set: updateData },
      { new: true, upsert: true }
    );

    if (isActive !== undefined) {
      await TenantSettings.findOneAndUpdate(
        { tenantId },
        { 'features.hasJobApplications': isActive },
        { new: true }
      );
    }

    res.json(settings);
  } catch (err) {
    console.error('Error updating job settings:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;