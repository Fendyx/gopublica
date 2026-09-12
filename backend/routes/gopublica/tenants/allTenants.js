const express = require('express');
const router = express.Router();
const TenantSettings = require('../../../models/TenantSettings');
const TenantUser = require('../../../models/TenantUser');
const Branch = require('../../../models/Branch');

/**
 * GET /api/gopublica/tenants/list
 * Returns all tenants with summary info (name, domain, niche, user/branch counts).
 */
router.get('/', async (req, res) => {
  try {
    // Fetch all tenant settings
    const allSettings = await TenantSettings.find()
      .select('tenantId businessName domain niche deploymentStatus createdAt primaryCurrency activeLocales')
      .sort({ createdAt: -1 })
      .lean();

    if (allSettings.length === 0) return res.json([]);

    const tenantIds = allSettings.map((s) => s.tenantId);

    // Count users and branches per tenant in bulk
    const [userCounts, branchCounts] = await Promise.all([
      TenantUser.aggregate([
        { $match: { tenantId: { $in: tenantIds } } },
        { $group: { _id: '$tenantId', count: { $sum: 1 } } },
      ]),
      Branch.aggregate([
        { $match: { tenantId: { $in: tenantIds }, isActive: true } },
        { $group: { _id: '$tenantId', count: { $sum: 1 } } },
      ]),
    ]);

    const userMap = Object.fromEntries(userCounts.map((u) => [u._id, u.count]));
    const branchMap = Object.fromEntries(branchCounts.map((b) => [b._id, b.count]));

    const result = allSettings.map((s) => ({
      tenantId: s.tenantId,
      businessName: s.businessName || '',
      domain: s.domain || '',
      niche: s.niche || 'food',
      status: s.deploymentStatus || 'pending',
      userCount: userMap[s.tenantId] || 0,
      branchCount: branchMap[s.tenantId] || 0,
      primaryCurrency: s.primaryCurrency || 'PLN',
      activeLocales: s.activeLocales || ['pl'],
      createdAt: s.createdAt,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
