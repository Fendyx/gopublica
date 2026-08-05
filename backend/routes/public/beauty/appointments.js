const express = require('express');
const router = express.Router();
const BeautyAppointment = require('../../../models/beauty/Appointment');
const { getAvailability } = require('../../../services/bookingAvailability');

router.get('/availability/slots', async (req, res) => {
  try {
    const { tenantId, branchId, serviceId, masterId, date, timezone } = req.query;
    if (!tenantId || !serviceId || !date) {
      return res.status(400).json({ error: 'tenantId, serviceId and date are required' });
    }

    const availability = await getAvailability({
      tenantId,
      branchId,
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
    const { tenantId, branchId, serviceId, masterId, startAt, endAt, guestInfo, notes, paymentStatus } = req.body;
    if (!tenantId || !serviceId || !startAt || !endAt) {
      return res.status(400).json({ error: 'tenantId, serviceId, startAt and endAt are required' });
    }

    const appointment = new BeautyAppointment({
      tenantId,
      branchId: branchId || null,
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
