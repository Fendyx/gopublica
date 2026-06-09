const express = require('express');
const router = express.Router();
const TenantSettings = require('../../models/TenantSettings');
const Branch = require('../../models/Branch');
const authTenant = require('../../middleware/authTenant');

// Публичный роут: получить настройки (глобальные или филиала)
router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    let globalSettings = await TenantSettings.findOne({ tenantId });
    if (!globalSettings) globalSettings = {};

    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, tenantId });
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      // Сливаем: глобальные + переопределения филиала
      const merged = {
        ...globalSettings.toObject?.(),
        ...branch.settingsOverride,
        // специально для часов – если в branch.settingsOverride есть hours/hoursI18n, они перекроют
      };
      // Убираем лишние mongoose-поля
      delete merged._id;
      delete merged.__v;
      delete merged.createdAt;
      delete merged.updatedAt;
      return res.json(merged);
    } else {
      return res.json(globalSettings);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищённый роут: обновить настройки (глобальные или филиала)
router.put('/', authTenant, async (req, res) => {
  try {
    const { branchId, ...settingsData } = req.body;
    const tenantId = req.tenantId;

    if (branchId) {
      // Обновляем переопределения филиала
      const branch = await Branch.findOne({ _id: branchId, tenantId });
      if (!branch) return res.status(404).json({ error: 'Branch not found' });

      // Обновляем только те поля, которые пришли
      Object.assign(branch.settingsOverride, settingsData);
      await branch.save();
      // Возвращаем смерженный результат
      const globalSettings = await TenantSettings.findOne({ tenantId }) || {};
      const merged = { ...globalSettings.toObject?.(), ...branch.settingsOverride };
      delete merged._id;
      return res.json(merged);
    } else {
      // Обновляем глобальные настройки
      const updated = await TenantSettings.findOneAndUpdate(
        { tenantId },
        settingsData,
        { upsert: true, returnDocument: 'after' }
      );
      return res.json(updated);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;