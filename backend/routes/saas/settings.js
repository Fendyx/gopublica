const express = require('express');
const router = express.Router();
const TenantSettings = require('../../models/TenantSettings');
const Branch = require('../../models/Branch');
const authTenant = require('../../middleware/authTenant');

// ─── НОВЫЙ РОУТ: поиск тенанта по домену ────────────────────────────────────
router.get('/by-domain', async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: 'domain required' });

    const settings = await TenantSettings
      .findOne({ domain })
      .select(
        'tenantId niche theme features businessName ' +   // убрали дублирование
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
router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    let globalSettings = await TenantSettings.findOne({ tenantId });
    if (!globalSettings) globalSettings = {};

    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, tenantId });
      if (!branch) return res.status(404).json({ error: 'Branch not found' });

      const globalObj = globalSettings.toObject?.() || {};
      
      // ГЛУБОКОЕ СЛИЯНИЕ ТЕМЫ (чтобы branch radius не затирал global primary)
      const globalTheme = globalObj.theme || {};
      const branchTheme = branch.settingsOverride?.theme || {};
      const mergedTheme = { ...globalTheme, ...branchTheme };

      const merged = {
        ...globalObj,
        ...branch.settingsOverride,
        theme: mergedTheme,
        workingHours: branch.workingHours,
        coordinates: branch.coordinates,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        city: branch.city,
        name: branch.name,
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
router.put('/', authTenant, async (req, res) => {
  try {
    const { branchId, ...reqBody } = req.body;
    const tenantId = req.tenantId;

    // 1. Сохраняем businessName глобально (не зависит от филиала)
    if (reqBody.businessName !== undefined) {
      await TenantSettings.findOneAndUpdate(
        { tenantId },
        { $set: { businessName: reqBody.businessName } },
        { upsert: true }
      );
      delete reqBody.businessName; // убираем, чтобы не мешало дальнейшей логике
    }

    // 2. ВСЕГДА СОХРАНЯЕМ ТЕМУ ГЛОБАЛЬНО (чтобы не обрезалась схемой Branch)
    if (reqBody.theme) {
      const globalSettings = await TenantSettings.findOne({ tenantId });
      if (globalSettings) {
        globalSettings.theme = {
          ...(globalSettings.theme?.toObject?.() || {}),
          ...reqBody.theme
        };
        globalSettings.markModified('theme');
        await globalSettings.save();
      } else {
        await TenantSettings.create({ tenantId, theme: reqBody.theme });
      }
      delete reqBody.theme; // Убираем theme из тела, чтобы не пытаться сохранить ее в Branch
    }

    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, tenantId });
      if (!branch) return res.status(404).json({ error: 'Branch not found' });

      const { 
        workingHours, 
        coordinates, 
        name, 
        city, 
        address, 
        phone, 
        email 
      } = reqBody;

      if (name !== undefined) branch.name = name;
      if (city !== undefined) branch.city = city;
      if (address !== undefined) branch.address = address;
      if (phone !== undefined) branch.phone = phone;
      if (email !== undefined) branch.email = email;
      if (coordinates !== undefined) branch.coordinates = coordinates;
      if (workingHours !== undefined) branch.workingHours = workingHours;

      const {
        workingHours: wh, 
        coordinates: coords, 
        name: n, 
        city: c, 
        address: a, 
        phone: p, 
        email: e, 
        ...settingsOverrideData 
      } = reqBody;

      Object.assign(branch.settingsOverride, settingsOverrideData);
      await branch.save();

      const globalSettings = await TenantSettings.findOne({ tenantId }) || {};
      const globalObj = globalSettings.toObject?.() || {};
      
      const merged = {
        ...globalObj,
        ...branch.settingsOverride,
        workingHours: branch.workingHours,
        coordinates: branch.coordinates,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        city: branch.city,
        name: branch.name,
      };
      delete merged._id;
      return res.json(merged);
      
    } else {
      const updated = await TenantSettings.findOneAndUpdate(
        { tenantId },
        { $set: reqBody },
        { upsert: true, returnDocument: 'after' }
      );
      return res.json(updated);
    }
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;