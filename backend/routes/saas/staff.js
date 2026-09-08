const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const StaffMember = require('../../models/tenant/StaffMember');
const Branch = require('../../models/Branch');
const authTenant = require('../../middleware/auth/tenant');
const checkBranch = require('../../middleware/tenant/branch');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

// ── GET /api/saas/staff ──────────────────────────────────────────────────────
// List all staff members for the tenant, optionally filtered by branch
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

    const members = await StaffMember.find(query).sort({ sortOrder: 1, name: 1 }).lean();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/saas/staff ─────────────────────────────────────────────────────
// Create a new staff member
router.post('/', authTenant, checkBranch, async (req, res) => {
  try {
    const member = new StaffMember({
      tenantId: req.tenantId,
      branchId: req.body.branchId || req.branch?._id || null,
      ...req.body,
    });
    await member.save();
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/saas/staff/:id ──────────────────────────────────────────────────
// Update an existing staff member
router.put('/:id', authTenant, checkBranch, async (req, res) => {
  try {
    const member = await StaffMember.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!member) return res.status(404).json({ error: 'Staff member not found' });
    Object.assign(member, req.body);
    await member.save();
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/saas/staff/:id ───────────────────────────────────────────────
// Delete a staff member
router.delete('/:id', authTenant, async (req, res) => {
  try {
    const member = await StaffMember.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!member) return res.status(404).json({ error: 'Staff member not found' });
    await StaffMember.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
