const express = require('express');
const router = express.Router();
const TenantSettings = require('../../models/TenantSettings');
const authTenant = require('../../middleware/authTenant');

// Публичный роут: получить настройки по tenantId
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    let settings = await TenantSettings.findOne({ tenantId });
    if (!settings) {
      // Если ещё не созданы — отдаём пустой объект или значения по умолчанию
      settings = {};
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый роут: обновить настройки
router.put('/', authTenant, async (req, res) => {
  try {
    const {
      phone,
      address,
      email,
      hours,
      googleMapsUrl,
      seoTitle,
      seoDescription,
      notifications,
      primaryLanguage,
      primaryCurrency   // <-- добавили это поле
    } = req.body;
    const tenantId = req.tenantId;

    const updated = await TenantSettings.findOneAndUpdate(
      { tenantId },
      {
        phone,
        address,
        email,
        hours,
        googleMapsUrl,
        seoTitle,
        seoDescription,
        notifications,   // <-- передаём в базу
        primaryLanguage,
        primaryCurrency   // <-- добавили это поле
      },
      { upsert: true, returnDocument: 'after' }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;