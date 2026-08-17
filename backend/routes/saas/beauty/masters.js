const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const BeautyMaster = require('../../../models/beauty/Master');
const Branch = require('../../../models/Branch');
const authTenant = require('../../../middleware/authTenant');
const checkBranch = require('../../../middleware/checkBranch');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

router.get('/', authTenant, async (req, res) => {
  try {
    const { branchId, branchSlug } = req.query;
    const query = { tenantId: req.tenantId };

    let resolvedBranchId = branchId;

    // If branchId is provided but is NOT a valid ObjectId, treat it as a slug
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId: req.tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found for slug' });
      resolvedBranchId = branch._id;
    }

    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId: req.tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }

    if (resolvedBranchId) query.branchId = resolvedBranchId;
    const masters = await BeautyMaster.find(query).populate('services').sort({ name: 1 });
    res.json(masters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authTenant, checkBranch, async (req, res) => {
  try {
    const master = new BeautyMaster({
      tenantId: req.tenantId,
      branchId: req.body.branchId || req.branch?._id || null,
      ...req.body,
    });
    await master.save();
    res.status(201).json(master);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authTenant, checkBranch, async (req, res) => {
  try {
    const master = await BeautyMaster.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!master) return res.status(404).json({ error: 'Master not found' });
    Object.assign(master, req.body);
    await master.save();
    res.json(master);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authTenant, async (req, res) => {
  try {
    const master = await BeautyMaster.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!master) return res.status(404).json({ error: 'Master not found' });
    await BeautyMaster.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
