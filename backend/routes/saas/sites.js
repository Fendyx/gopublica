const express = require('express');
const router = express.Router();
const Site = require('../../models/Site');
const TenantSettings = require('../../models/TenantSettings');
const TenantUser = require('../../models/TenantUser');
const authTenant = require('../../middleware/authTenant');

// GET /saas/sites - Get all sites for the authenticated tenant
router.get('/', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    // Get all active sites for this tenant
    const sites = await Site.find({ tenantId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    // Also get legacy domain from TenantSettings for backward compatibility
    const settings = await TenantSettings.findOne({ tenantId }).lean();

    res.json({ 
      sites: sites || [], 
      legacyDomain: settings?.domain || null 
    });
  } catch (err) {
    console.error('Error fetching sites:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /saas/sites/check-limit - Check site creation limits for the tenant
router.get('/check-limit', authTenant, async (req, res) => {
  try {
    const limitCheck = await Site.checkSiteLimit(req.tenantId);
    res.json(limitCheck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /saas/sites - Create a new site for the tenant
router.post('/', authTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, type = 'primary', niche, subdomain, domain } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Site name is required' });
    }
    if (!niche) {
      return res.status(400).json({ error: 'Niche is required' });
    }

    // Check subscription limits
    const limitCheck = await Site.checkSiteLimit(tenantId);
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        error: limitCheck.reason,
        currentCount: limitCheck.currentCount,
        maxSites: limitCheck.maxSites,
        plan: limitCheck.plan,
      });
    }

    // Get tenant user for plan info
    const tenantUser = await TenantUser.findOne({ tenantId }).select('subscriptionPlan subscriptionStatus');
    const plan = (tenantUser?.subscriptionStatus === 'active' || tenantUser?.subscriptionStatus === 'trialing') 
      ? tenantUser?.subscriptionPlan 
      : 'none';

    // Validate domain/subdomain uniqueness if provided
    if (domain) {
      const existingDomain = await Site.findOne({ domain: domain.toLowerCase() });
      if (existingDomain) {
        return res.status(409).json({ error: 'Domain already in use' });
      }
      // Also check TenantSettings for legacy domains
      const legacySettings = await TenantSettings.findOne({ domain: domain.toLowerCase() });
      if (legacySettings && legacySettings.tenantId !== tenantId) {
        return res.status(409).json({ error: 'Domain already in use' });
      }
    }

    if (subdomain) {
      // Subdomain must be unique per tenant
      const existingSubdomain = await Site.findOne({ tenantId, subdomain: subdomain.toLowerCase() });
      if (existingSubdomain) {
        return res.status(409).json({ error: 'Subdomain already in use for this tenant' });
      }
    }

    // If type is primary and no domain provided, check if tenant already has a primary site
    if (type === 'primary') {
      const existingPrimary = await Site.findOne({ tenantId, type: 'primary', isActive: true });
      if (existingPrimary) {
        return res.status(409).json({ error: 'Tenant already has a primary site' });
      }
    }

    // Create the site
    const site = await Site.create({
      tenantId,
      name: name.trim(),
      type,
      niche,
      subdomain: subdomain?.toLowerCase() || undefined,
      domain: domain?.toLowerCase() || undefined,
      createdUnderPlan: plan,
    });

    // If this is the first site and tenant has a legacy domain, link it
    if (domain && settings) {
      await TenantSettings.findOneAndUpdate(
        { tenantId },
        { $set: { domain: domain.toLowerCase() } }
      );
    }

    res.status(201).json(site);
  } catch (err) {
    console.error('Error creating site:', err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Domain or subdomain already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /saas/sites/:id - Get a specific site
router.get('/:id', authTenant, async (req, res) => {
  try {
    const site = await Site.findOne({ 
      _id: req.params.id, 
      tenantId: req.tenantId,
      isActive: true 
    }).lean();

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json(site);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /saas/sites/:id - Update a site
router.patch('/:id', authTenant, async (req, res) => {
  try {
    const { name, subdomain, domain, niche, theme, status } = req.body;
    const update = {};

    if (name !== undefined) update.name = name.trim();
    if (subdomain !== undefined) update.subdomain = subdomain?.toLowerCase();
    if (domain !== undefined) update.domain = domain?.toLowerCase();
    if (niche !== undefined) update.niche = niche;
    if (theme !== undefined) update.theme = theme;
    if (status !== undefined) update.status = status;

    // Validate uniqueness if domain/subdomain changing
    if (update.domain) {
      const existing = await Site.findOne({ 
        domain: update.domain, 
        _id: { $ne: req.params.id },
        isActive: true 
      });
      if (existing) {
        return res.status(409).json({ error: 'Domain already in use' });
      }
    }
    if (update.subdomain) {
      const existing = await Site.findOne({ 
        tenantId: req.tenantId,
        subdomain: update.subdomain, 
        _id: { $ne: req.params.id },
        isActive: true 
      });
      if (existing) {
        return res.status(409).json({ error: 'Subdomain already in use for this tenant' });
      }
    }

    const site = await Site.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, isActive: true },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json(site);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Domain or subdomain already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /saas/sites/:id - Soft delete a site
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const site = await Site.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    ).lean();

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({ message: 'Site deleted successfully', site });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /saas/sites/:id/deploy - Trigger deployment for a site
router.post('/:id/deploy', authTenant, async (req, res) => {
  try {
    const site = await Site.findOne({ 
      _id: req.params.id, 
      tenantId: req.tenantId,
      isActive: true 
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Add deployment log entry
    site.addDeploymentLog('building', '', 'Deployment triggered manually');
    await site.save();

    // TODO: Integrate with actual deployment system (Vercel, Netlify, etc.)
    // For now, just return success
    res.json({ 
      message: 'Deployment triggered', 
      site: {
        id: site._id,
        status: site.status,
        lastDeployedAt: site.lastDeployedAt,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;