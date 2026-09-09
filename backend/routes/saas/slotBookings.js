const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authTenant = require('../../middleware/auth/tenant');
const BookingSlot = require('../../models/booking/BookingSlot');
const SlotBooking = require('../../models/booking/SlotBooking');
const Branch = require('../../models/Branch');
const {
  generateSlotsForDate,
  getAvailableSlots,
  getAllSlotBookings,
  cancelSlotBooking,
} = require('../../services/booking/slots');

function isValidObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
}

router.use(authTenant);

// ── GET /slots — List slots for a date (admin) ──────────────────────────
router.get('/slots', async (req, res) => {
  try {
    const { branchId, branchSlug, date } = req.query;
    const tenantId = req.tenantId;

    if (!date) return res.status(400).json({ error: 'date is required' });

    // Resolve branch
    let resolvedBranchId = branchId;
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }
    if (!resolvedBranchId) return res.status(400).json({ error: 'branchId is required' });

    const slots = await getAvailableSlots(tenantId, resolvedBranchId, date);
    res.json(slots);
  } catch (err) {
    console.error('🔴 [ADMIN-SLOTS] GET /slots error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /slots/generate — Generate slots for a date ────────────────────
router.post('/slots/generate', async (req, res) => {
  try {
    const { branchId, branchSlug, date, slotStartTime, slotEndTime, slotIntervalMinutes, slotCapacity } = req.body;
    const tenantId = req.tenantId;

    if (!date) return res.status(400).json({ error: 'date is required' });

    // Resolve branch
    let resolvedBranchId = branchId;
    if (resolvedBranchId && !isValidObjectId(resolvedBranchId)) {
      const branch = await Branch.findOne({ slug: resolvedBranchId, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }
    if (!resolvedBranchId && branchSlug) {
      const branch = await Branch.findOne({ slug: branchSlug, tenantId }).lean();
      if (!branch) return res.status(404).json({ error: 'Branch not found' });
      resolvedBranchId = branch._id;
    }
    if (!resolvedBranchId) return res.status(400).json({ error: 'branchId is required' });

    // Use provided config or defaults
    const config = {
      slotStartTime: slotStartTime || '09:00',
      slotEndTime: slotEndTime || '22:00',
      slotIntervalMinutes: slotIntervalMinutes || 60,
      slotCapacity: slotCapacity || 10,
    };

    const slots = await generateSlotsForDate(tenantId, resolvedBranchId, date, config);
    res.status(201).json(slots);
  } catch (err) {
    console.error('🔴 [ADMIN-SLOTS] POST /slots/generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /slots/:id/bookings — All bookings for a slot ───────────────────
router.get('/slots/:id/bookings', async (req, res) => {
  try {
    const slot = await BookingSlot.findById(req.params.id).lean();
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    if (slot.tenantId !== req.tenantId) return res.status(403).json({ error: 'Access denied' });

    const bookings = await getAllSlotBookings(req.tenantId, slot._id);
    res.json(bookings);
  } catch (err) {
    console.error('🔴 [ADMIN-SLOTS] GET /slots/:id/bookings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /slots/:id/bookings — Admin manually adds attendee ─────────────
router.post('/slots/:id/bookings', async (req, res) => {
  try {
    const { name, phone, email, partySize, comment } = req.body;
    const tenantId = req.tenantId;

    if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });
    if (!partySize || partySize < 1) return res.status(400).json({ error: 'partySize must be at least 1' });

    const slot = await BookingSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    if (slot.tenantId !== tenantId) return res.status(403).json({ error: 'Access denied' });

    const booking = new SlotBooking({
      tenantId,
      branchId: slot.branchId,
      slotId: slot._id,
      date: slot.date,
      startTime: slot.startTime,
      name,
      phone,
      email: email || '',
      partySize: partySize || 1,
      comment: comment || '',
      status: 'confirmed', // Admin-created bookings are auto-confirmed
    });

    await booking.save();

    // Atomically increment slot bookedCount
    await BookingSlot.findByIdAndUpdate(slot._id, { $inc: { bookedCount: booking.partySize } });

    res.status(201).json(booking);
  } catch (err) {
    console.error('🔴 [ADMIN-SLOTS] POST /slots/:id/bookings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /bookings/:bookingId — Remove an attendee ─────────────────────
router.delete('/bookings/:bookingId', async (req, res) => {
  try {
    const result = await cancelSlotBooking(req.params.bookingId, req.tenantId);

    if (result.error === 'NOT_FOUND') return res.status(404).json({ error: 'Booking not found' });
    if (result.error === 'FORBIDDEN') return res.status(403).json({ error: 'Access denied' });
    if (result.error === 'ALREADY_CANCELLED') return res.status(400).json({ error: 'Booking is already cancelled' });

    res.json({ message: 'Booking removed' });
  } catch (err) {
    console.error('🔴 [ADMIN-SLOTS] DELETE /bookings/:bookingId error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /bookings/:bookingId/status — Update booking status ────────────
router.patch('/bookings/:bookingId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const booking = await SlotBooking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.tenantId !== req.tenantId) return res.status(403).json({ error: 'Access denied' });

    const wasActive = ['pending', 'confirmed'].includes(booking.status);
    const willBeActive = ['pending', 'confirmed'].includes(status);

    booking.status = status;
    await booking.save();

    // Adjust slot bookedCount if transitioning between active/inactive
    if (wasActive && !willBeActive) {
      // Becoming cancelled: atomically decrement
      await BookingSlot.findByIdAndUpdate(booking.slotId, { $inc: { bookedCount: -booking.partySize } });
    } else if (!wasActive && willBeActive) {
      // Becoming active again: atomically increment
      await BookingSlot.findByIdAndUpdate(booking.slotId, { $inc: { bookedCount: booking.partySize } });
    }

    res.json(booking);
  } catch (err) {
    console.error('🔴 [ADMIN-SLOTS] PATCH /bookings/:bookingId/status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
