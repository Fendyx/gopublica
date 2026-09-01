const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TenantSettings = require('../../models/TenantSettings');
const Branch = require('../../models/Branch');
const authTenant = require('../../middleware/auth/tenant');
const { getModuleAccess } = require('../../services/tenant/moduleAccess');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

// Helper: проверить, что домен/алиас не занят другим тенантом
async function isDomainTaken(hostname, excludeTenantId) {
  if (!hostname) return false;
  const normalized = hostname.toLowerCase().trim();
  const existing = await TenantSettings.findOne({
    tenantId: { $ne: excludeTenantId },
    $or: [
      { domain: normalized },
      { aliases: normalized },
    ],
  }).lean();
  return !!existing;
}

// Helper: очистить польские идентификаторы (NIP/REGON/KRS) от пробелов и дефисов
function sanitizeLegal(legal) {
  if (!legal || typeof legal !== 'object') return legal;
  const clean = { ...legal };
  for (const key of ['nip', 'regon', 'krs']) {
    if (typeof clean[key] === 'string') {
      clean[key] = clean[key].replace(/[\s-]/g, '');
    }
  }
  return clean;
}

// ─── НОВЫЙ РОУТ: поиск тенанта по домену ────────────────────────────────────
router.get('/by-domain', async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) return res.status(400).json({ error: 'domain required' });

    const settings = await TenantSettings
      .findOne({ $or: [{ domain }, { aliases: domain }] })
      .select(
        'tenantId niche businessType moduleAccess theme features businessName logoUrl faviconUrl ' +
        'phone address email hours seoTitle seoDescription ' +
        'primaryLanguage primaryCurrency legal ' +
        'logistics.enabled logistics.provider logistics.mapApiKey logistics.env'
      );

    if (!settings) return res.status(404).json({ error: 'Tenant not found' });

    const access = getModuleAccess(settings.toObject ? settings.toObject() : settings);
    res.json({
      ...settings.toObject ? settings.toObject() : settings,
      moduleAccess: access.moduleAccess,
      availableModules: access.availableModules,
      canManageOrders: access.canManageOrders,
      canManageMenu: access.canManageMenu,
      canManageReservations: access.canManageReservations,
      canManageGallery: access.canManageGallery,
      canManageNews: access.canManageNews,
      canManageJobs: access.canManageJobs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── СУЩЕСТВУЮЩИЙ РОУТ: получить настройки (глобальные или филиала) ──────────
router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId, branchSlug } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    let globalSettings = await TenantSettings.findOne({ tenantId });
    if (!globalSettings) globalSettings = {};
    const access = getModuleAccess(globalSettings.toObject ? globalSettings.toObject() : globalSettings);

    let resolvedBranchId = branchId;
    // If branchId is provided but is NOT a valid ObjectId, treat it as a slug
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found for slug' });
      resolvedBranchId = branch._id;
    }
    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }

    if (resolvedBranchId) {
      const branch = await Branch.findOne({ _id: resolvedBranchId, tenantId });
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
        moduleAccess: access.moduleAccess,
        availableModules: access.availableModules,
        canManageOrders: access.canManageOrders,
        canManageMenu: access.canManageMenu,
        canManageReservations: access.canManageReservations,
        canManageGallery: access.canManageGallery,
        canManageNews: access.canManageNews,
        canManageJobs: access.canManageJobs,
      };
      delete merged._id;
      delete merged.__v;
      delete merged.createdAt;
      delete merged.updatedAt;
      return res.json(merged);
    } else {
      return res.json({
        ...(globalSettings.toObject ? globalSettings.toObject() : globalSettings),
        moduleAccess: access.moduleAccess,
        availableModules: access.availableModules,
        canManageOrders: access.canManageOrders,
        canManageMenu: access.canManageMenu,
        canManageReservations: access.canManageReservations,
        canManageGallery: access.canManageGallery,
        canManageNews: access.canManageNews,
        canManageJobs: access.canManageJobs,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── СУЩЕСТВУЮЩИЙ РОУТ: обновить настройки (глобальные или филиала) ──────────
router.put('/', authTenant, async (req, res) => {
  console.log('1. PUT /settings - Request received, branchId:', req.body?.branchId);

  try {
    const { branchId, ...reqBody } = req.body;
    const tenantId = req.tenantId;

    // 0a. Очистим NIP/REGON/KRS от пробелов и тире, чтобы Mongoose не ругался
    if (reqBody.legal) {
      if (typeof reqBody.legal.nip === 'string') reqBody.legal.nip = reqBody.legal.nip.replace(/[\s-]/g, '');
      if (typeof reqBody.legal.regon === 'string') reqBody.legal.regon = reqBody.legal.regon.replace(/[\s-]/g, '');
      if (typeof reqBody.legal.krs === 'string') reqBody.legal.krs = reqBody.legal.krs.replace(/[\s-]/g, '');
    }

    // 0. Проверка уникальности domain/aliases
    if (reqBody.domain !== undefined) {
      if (await isDomainTaken(reqBody.domain, tenantId)) {
        return res.status(409).json({ error: 'Domain already in use' });
      }
    }
    if (Array.isArray(reqBody.aliases)) {
      for (const alias of reqBody.aliases) {
        if (await isDomainTaken(alias, tenantId)) {
          return res.status(409).json({ error: `Alias '${alias}' is already in use` });
        }
      }
    }

    // 1. Сохраняем businessName глобально
    if (reqBody.businessName !== undefined) {
      await TenantSettings.findOneAndUpdate(
        { tenantId },
        { $set: { businessName: reqBody.businessName } },
        { upsert: true }
      );
      delete reqBody.businessName;
    }

    // 1b. Сохраняем логотип и фавикон глобально (tenant-level branding)
    const brandingFields = {};
    if (reqBody.logoUrl !== undefined) brandingFields.logoUrl = reqBody.logoUrl;
    if (reqBody.faviconUrl !== undefined) brandingFields.faviconUrl = reqBody.faviconUrl;
    if (Object.keys(brandingFields).length > 0) {
      await TenantSettings.findOneAndUpdate(
        { tenantId },
        { $set: brandingFields },
        { upsert: true }
      );
      delete reqBody.logoUrl;
      delete reqBody.faviconUrl;
    }

    // 2. Сохраняем тему глобально
    if (reqBody.theme) {
      let globalSettings = await TenantSettings.findOne({ tenantId });
      if (!globalSettings) globalSettings = new TenantSettings({ tenantId });
      globalSettings.theme = { ...(globalSettings.theme?.toObject?.() || {}), ...reqBody.theme };
      globalSettings.markModified('theme');
      await globalSettings.save();
      delete reqBody.theme;
    }

    // 3. ИСПРАВЛЕНИЕ: Сохраняем LEGAL глобально ВСЕГДА!
    if (reqBody.legal) {
      console.log('-> Saving legal globally...');
      let globalSettings = await TenantSettings.findOne({ tenantId });
      if (!globalSettings) globalSettings = new TenantSettings({ tenantId });
      
      const existingLegal = globalSettings.legal?.toObject?.() || globalSettings.legal || {};
      globalSettings.legal = { ...existingLegal, ...reqBody.legal };
      globalSettings.markModified('legal');
      await globalSettings.save();
      
      // УДАЛЯЕМ из тела запроса, чтобы legal не сохранился по ошибке в настройки филиала!
      delete reqBody.legal; 
      console.log('-> Legal saved successfully');
    }

    // 4. Если есть branchId -> сохраняем остатки в филиал
    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, tenantId });
      if (!branch) return res.status(404).json({ error: 'Branch not found' });

      const { workingHours, coordinates, name, city, address, phone, email } = reqBody;
      if (name !== undefined) branch.name = name;
      if (city !== undefined) branch.city = city;
      if (address !== undefined) branch.address = address;
      if (phone !== undefined) branch.phone = phone;
      if (email !== undefined) branch.email = email;
      if (coordinates !== undefined) branch.coordinates = coordinates;
      if (workingHours !== undefined) branch.workingHours = workingHours;

      // Всё остальное летит в settingsOverride филиала
      const { workingHours: wh, coordinates: coords, name: n, city: c, address: a, phone: p, email: e, ...settingsOverrideData } = reqBody;
      Object.assign(branch.settingsOverride, settingsOverrideData);

      try {
        await branch.save();
      } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ message: err.message });
        throw err;
      }

      // Возвращаем склеенный объект
      const globalSettings = await TenantSettings.findOne({ tenantId }) || {};
      const globalObj = globalSettings.toObject?.() || {};
      const access = getModuleAccess(globalObj);

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
        moduleAccess: access.moduleAccess,
        availableModules: access.availableModules,
        canManageOrders: access.canManageOrders,
        canManageMenu: access.canManageMenu,
        canManageReservations: access.canManageReservations,
        canManageGallery: access.canManageGallery,
        canManageNews: access.canManageNews,
        canManageJobs: access.canManageJobs,
      };
      delete merged._id;
      return res.json(merged);
      
    } else {
      // 5. Глобальное обновление (если нет branchId)
      let globalSettings = await TenantSettings.findOne({ tenantId });
      if (!globalSettings) globalSettings = new TenantSettings({ tenantId });

      Object.assign(globalSettings, reqBody);

      try {
        await globalSettings.save();
      } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ message: err.message });
        throw err;
      }

      const updatedAccess = getModuleAccess(globalSettings.toObject ? globalSettings.toObject() : globalSettings);
      const responseObj = {
        ...(globalSettings.toObject ? globalSettings.toObject() : globalSettings),
        moduleAccess: updatedAccess.moduleAccess,
        availableModules: updatedAccess.availableModules,
        canManageOrders: updatedAccess.canManageOrders,
        canManageMenu: updatedAccess.canManageMenu,
        canManageReservations: updatedAccess.canManageReservations,
        canManageGallery: updatedAccess.canManageGallery,
        canManageNews: updatedAccess.canManageNews,
        canManageJobs: updatedAccess.canManageJobs,
      };
      return res.json(responseObj);
    }
  } catch (err) {
    console.error('CRASH IN SETTINGS PUT:', err);
    return res.status(500).json({ message: err.message, stack: err.stack });
  }
});

module.exports = router;