const express = require('express');
const router = express.Router();
const BeautyAppointment = require('../../../models/beauty/Appointment');
const authTenant = require('../../../middleware/authTenant');
const checkBranch = require('../../../middleware/checkBranch');

router.get('/', authTenant, async (req, res) => {
  try {
    const { branchId, from, to, status } = req.query;
    const query = { tenantId: req.tenantId };
    if (branchId) query.branchId = branchId;
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
    const appointment = new BeautyAppointment({
      tenantId: req.tenantId,
      branchId: req.body.branchId || req.branch?._id || null,
      ...req.body,
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
