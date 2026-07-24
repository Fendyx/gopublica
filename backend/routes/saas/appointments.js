const express = require('express');
const router = express.Router();

const ServiceAppointment = require('../../models/ServiceAppointment');
const resolveTenant = require('../../middleware/resolveTenant');

/**
 * POST /api/saas/appointments/public
 *
 * Public endpoint — creates a new service appointment for the tenant resolved
 * from the request Host header. No authentication required (guest bookings).
 *
 * Required body:
 *   - branchId:    String
 *   - startAt:    ISO Date string
 *   - endAt:      ISO Date string
 *   - guestInfo:  { name: String, phone: String, email?: String }
 *
 * Optional body:
 *   - services:  [{ serviceId, name, price }]
 *   - metadata:  { key: value }   (niche-specific attributes)
 *   - notes:     String
 */
router.post('/public', resolveTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const {
      branchId,
      services,
      startAt,
      endAt,
      guestInfo,
      metadata,
      notes,
    } = req.body;

    // ─── Basic validation ───────────────────────────────────────────────────
    if (!branchId) {
      return res.status(400).json({ success: false, message: 'branchId is required' });
    }
    if (!startAt || !endAt) {
      return res
        .status(400)
        .json({ success: false, message: 'startAt and endAt are required' });
    }
    if (
      !guestInfo ||
      !guestInfo.name ||
      !guestInfo.phone
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'guestInfo.name and guestInfo.phone are required' });
    }

    // ─── Create & persist ──────────────────────────────────────────────────
    const appointment = new ServiceAppointment({
      tenantId,
      branchId,
      services: Array.isArray(services) ? services : [],
      startAt,
      endAt,
      guestInfo,
      metadata: metadata || {},
      notes: notes || '',
    });

    const savedAppointment = await appointment.save();

    return res.status(201).json({ success: true, appointment: savedAppointment });
  } catch (err) {
    console.error('POST /api/saas/appointments/public error:', err.message);

    // Surface Mongoose validation errors as 400 instead of 500
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }

    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
