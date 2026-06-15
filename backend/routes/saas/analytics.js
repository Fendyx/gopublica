const express = require('express');
const router  = express.Router();
const Analytics = require('../../models/Analytics');
const authTenant = require('../../middleware/authTenant');

// POST /api/saas/analytics/track  — публичный, вызывается из Next.js API route
router.post('/track', async (req, res) => {
  try {
    const { tenantId, hash, city, device, date } = req.body;
    if (!tenantId || !hash || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Проверяем — был ли этот хэш сегодня
    const existing = await Analytics.findOne({ tenantId, date, visitorsHashes: hash });
    const isUnique = !existing;

    const incUpdate = { totalViews: 1 };
    if (isUnique) incUpdate.uniqueVisitors = 1;
    if (city)     incUpdate[`cities.${city}`]    = 1;
    if (device)   incUpdate[`devices.${device}`] = 1;

    const update = { $inc: incUpdate };
    if (isUnique) update.$addToSet = { visitorsHashes: hash };

    await Analytics.findOneAndUpdate(
      { tenantId, date },
      update,
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/saas/analytics?days=30  — защищён, для дашборда
router.get('/', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const days = Math.min(parseInt(req.query.days) || 30, 90);

    // Генерируем массив дат
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toISOString().slice(0, 10);
    });

    const records = await Analytics.find({ tenantId, date: { $in: dates } });
    const recordsMap = Object.fromEntries(records.map(r => [r.date, r]));

    // Timeline с заполнением пустых дней нулями
    const timeline = dates.map(date => ({
      date,
      totalViews:     recordsMap[date]?.totalViews     ?? 0,
      uniqueVisitors: recordsMap[date]?.uniqueVisitors ?? 0,
    }));

    // Агрегируем города и устройства за период
    const cities = {};
    const devices = {};
    let totalViews = 0;
    let uniqueVisitors = 0;

    for (const r of records) {
      totalViews     += r.totalViews;
      uniqueVisitors += r.uniqueVisitors;
      for (const [k, v] of (r.cities  ?? [])) cities[k]  = (cities[k]  || 0) + v;
      for (const [k, v] of (r.devices ?? [])) devices[k] = (devices[k] || 0) + v;
    }

    res.json({
      totalViews,
      uniqueVisitors,
      timeline,
      cities:  Object.entries(cities).map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value).slice(0, 8),
      devices: Object.entries(devices).map(([name, value]) => ({ name, value })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;