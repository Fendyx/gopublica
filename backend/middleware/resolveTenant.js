const TenantSettings = require('../models/TenantSettings');

module.exports = async function resolveTenant(req, res, next) {
  try {
    const host = req.get('host') || '';
    if (!host) {
      return res.status(400).json({ error: 'Host header missing' });
    }

    const tenant = await TenantSettings.findOne({ domain: host }).lean();
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found for this domain' });
    }

    req.tenant = tenant;
    req.tenantId = tenant.tenantId;
    next();
  } catch (err) {
    console.error('resolveTenant error:', err.message);
    res.status(500).json({ error: 'Failed to resolve tenant' });
  }
};