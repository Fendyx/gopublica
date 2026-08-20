const TenantSettings = require('../models/TenantSettings');

module.exports = async function resolveTenant(req, res, next) {
  try {
    const host = req.get('host') || '';
    if (!host) {
      return res.status(400).json({ error: 'Host header missing' });
    }

    // Strip port from the end safely (handles IPv6 and standard ports like :3000)
    const cleanHost = host.replace(/:\d+$/, '');

    console.log('[resolveTenant] Looking up domain:', cleanHost);

    // Ищем по каноническому domain ИЛИ по любому aliases (локальные, staging, технические)
    const tenant = await TenantSettings.findOne({
      $or: [
        { domain: cleanHost },
        { aliases: cleanHost },
      ],
    }).lean();

    if (!tenant) {
      console.warn('[resolveTenant] Tenant not found for domain:', cleanHost);
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