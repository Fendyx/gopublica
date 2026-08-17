const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const BeautyAppointment = require('../../../models/beauty/Appointment');
const Branch = require('../../../models/Branch');
const authTenant = require('../../../middleware/authTenant');
const checkBranch = require('../../../middleware/checkBranch');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

router.get('/', authTenant, async (req, res) => {
  try {
    const { branchId, branchSlug, from, to, status } = req.query;
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
    if (status) query.status = status;
    if (from || to) {
      query.startAt = {};
      if (from) query.startAt.$gte = new Date(from);
      if (to) query.startAt.$lte = new Date(to);
    }
    const appointments = await BeautyAppointment.find(query)
      .populate('serviceId', 'name price durationMinutes')
      .populate('masterId', 'name photo')
      .sort({ startAt: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authTenant, checkBranch, async (req, res) => {
  try {
    const { branchId, branchSlug, ...rest } = req.body;

    // Use resolved branch from middleware (supports both branchId and branchSlug)
    // checkBranch middleware already resolved branchId (even if it was a slug) or branchSlug
    let resolvedBranchId = req.branch ? req.branch._id : (branchId || null);

    const appointment = new BeautyAppointment({
      tenantId: req.tenantId,
      branchId: resolvedBranchId,
      ...rest,
    });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', authTenant, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await BeautyAppointment.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    appointment.status = status;
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
