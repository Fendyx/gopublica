const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const BeautyAppointment = require('../../../models/beauty/Appointment');
const Branch = require('../../../models/Branch');
const { getAvailability } = require('../../../services/bookingAvailability');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

router.get('/availability/slots', async (req, res) => {
  try {
    const { tenantId, branchId, branchSlug, serviceId, masterId, date, timezone } = req.query;
    if (!tenantId || !serviceId || !date) {
      return res.status(400).json({ error: 'tenantId, serviceId and date are required' });
    }

    let resolvedBranchId = branchId;

    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) {
        return res.status(404).json({ error: 'Branch not found for slug' });
      }
      resolvedBranchId = branch._id;
    }

    const availability = await getAvailability({
      tenantId,
      branchId: resolvedBranchId,
      serviceId,
      masterId,
      date,
      timezone,
    });

    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const { tenantId, branchId, branchSlug, serviceId, masterId, startAt, endAt, guestInfo, notes, paymentStatus } = req.body;

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
    if (!tenantId || !serviceId || !startAt || !endAt) {
      return res.status(400).json({ error: 'tenantId, serviceId, startAt and endAt are required' });
    }

    const appointment = new BeautyAppointment({
      tenantId,
      branchId: resolvedBranchId || null,
      serviceId,
      masterId: masterId || null,
      guestInfo: guestInfo || {},
      startAt,
      endAt,
      notes: notes || '',
      paymentStatus: paymentStatus || 'pay_later',
      status: 'pending',
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
