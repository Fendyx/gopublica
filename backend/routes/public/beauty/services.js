const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const BeautyService = require('../../../models/beauty/ServiceItem');
const Branch = require('../../../models/Branch');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

router.get('/', async (req, res) => {
  try {
    const { tenantId, branchId, branchSlug } = req.query;
    if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

    let resolvedBranchId = branchId;

    // If branchId is provided but is NOT a valid ObjectId, treat it as a slug
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId }).lean();
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found for slug' });
      }
      resolvedBranchId = branch._id;
    }

    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found for slug' });
      }
      resolvedBranchId = branch._id;
    }

    const query = { tenantId, isActive: true };
    if (resolvedBranchId) query.branchId = resolvedBranchId;

    const services = await BeautyService.find(query).sort({ sortOrder: 1, createdAt: 1 }).lean();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
