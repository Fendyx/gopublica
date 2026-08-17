const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const ServiceAppointment = require('../../models/ServiceAppointment');
const Branch = require('../../models/Branch');
const resolveTenant = require('../../middleware/resolveTenant');

// Helper: check if a string is a valid MongoDB ObjectId (24-char hex)
function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

/**
 * POST /api/saas/appointments/public
 *
 * Public endpoint — creates a new service appointment for the tenant resolved
 * from the request Host header. No authentication required (guest bookings).
 *
 * Required body:
 *   - branchId:    String  (or branchSlug: String)
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
      branchSlug,
      services,
      startAt,
      endAt,
      guestInfo,
      metadata,
      notes,
    } = req.body;

    // Resolve branchId from branchSlug if needed
    let resolvedBranchId = branchId;

    // If branchId is provided but is NOT a valid ObjectId, treat it as a slug
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId }).lean();
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found for slug' });
      }
      resolvedBranchId = branch._id;
    }

    // If branchSlug is provided, resolve it to a branchId
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found for slug' });
      }
      resolvedBranchId = branch._id;
    }

    // ─── Basic validation ───────────────────────────────────────────────────
    if (!resolvedBranchId) {
      return res.status(400).json({ success: false, message: 'branchId or branchSlug is required' });
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
      branchId: resolvedBranchId,
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
