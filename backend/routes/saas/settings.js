const express = require('express');
const router = express.Router();
const TenantSettings = require('../../models/TenantSettings');
const Branch = require('../../models/Branch');
const authTenant = require('../../middleware/authTenant');

// ─── НОВЫЙ РОУТ: поиск тенанта по домену ────────────────────────────────────
// GET /api/saas/settings/by-domain?domain=sushi-master.com
// Публичный (без авторизации) — вызывается proxy.ts при каждом запросе
router.get('/by-domain', async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: 'domain required' });

    const settings = await TenantSettings
      .findOne({ domain })
      .select(
        'tenantId niche theme features ' +
        'phone address email hours seoTitle seoDescription ' +
        'primaryLanguage primaryCurrency'
      );

    if (!settings) return res.status(404).json({ error: 'Tenant not found' });

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── СУЩЕСТВУЮЩИЙ РОУТ: получить настройки (глобальные или филиала) ──────────
// GET /api/saas/settings?tenantId=xxx&branchId=yyy
router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    let globalSettings = await TenantSettings.findOne({ tenantId });
    if (!globalSettings) globalSettings = {};

    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, tenantId });
      if (!branch) return res.status(404).json({ error: 'Branch not found' });

      const merged = {
        ...globalSettings.toObject?.(),
        ...branch.settingsOverride,
      };
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

// ─── СУЩЕСТВУЮЩИЙ РОУТ: обновить настройки (глобальные или филиала) ──────────
// PUT /api/saas/settings
router.put('/', authTenant, async (req, res) => {
  try {
    const { branchId, ...settingsData } = req.body;
    const tenantId = req.tenantId;

    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, tenantId });
      if (!branch) return res.status(404).json({ error: 'Branch not found' });

      Object.assign(branch.settingsOverride, settingsData);
      await branch.save();

      const globalSettings = await TenantSettings.findOne({ tenantId }) || {};
      const merged = { ...globalSettings.toObject?.(), ...branch.settingsOverride };
      delete merged._id;
      return res.json(merged);
    } else {
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