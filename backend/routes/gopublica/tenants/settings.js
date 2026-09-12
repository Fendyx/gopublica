const express = require('express');
const router = express.Router();
const TenantSettings = require('../../../models/TenantSettings');
const Branch = require('../../../models/Branch');
const { LOCALE_CODES, isValidLocale } = require('../../../config/locales');

// Helper: check if domain/alias is taken by another tenant
async function isDomainTaken(hostname, excludeTenantId) {
  if (!hostname) return false;
  const normalized = hostname.toLowerCase().trim();
  const existing = await TenantSettings.findOne({
    tenantId: { $ne: excludeTenantId },
    $or: [{ domain: normalized }, { aliases: normalized }],
  }).lean();
  return !!existing;
}

// Helper: sanitize Polish legal IDs
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

/**
 * GET /api/gopublica/tenants/settings?tenantId=xxx
 * Returns full TenantSettings document.
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const settings = await TenantSettings.findOne({ tenantId }).lean();
    if (!settings) return res.status(404).json({ error: 'Tenant not found' });

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/gopublica/tenants/settings?tenantId=xxx
 * Full update of TenantSettings. Handles the same field extraction logic
 * as the saas/settings PUT (theme, legal, navigation, features, locale fields).
 */
router.put('/', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.body.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    const { branchId, tenantId: _tid, ...reqBody } = req.body;

    // Sanitize legal fields
    if (reqBody.legal) {
      reqBody.legal = sanitizeLegal(reqBody.legal);
    }

    // Check domain/alias uniqueness
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

    let settings = await TenantSettings.findOne({ tenantId });
    if (!settings) settings = new TenantSettings({ tenantId });

    // Apply all fields from reqBody
    Object.assign(settings, reqBody);

    try {
      await settings.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Duplicate domain or alias' });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }
      throw err;
    }

    res.json(settings.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
