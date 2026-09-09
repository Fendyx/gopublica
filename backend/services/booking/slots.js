'use strict';

const mongoose = require('mongoose');
const BookingSlot = require('../../models/booking/BookingSlot');
const SlotBooking = require('../../models/booking/SlotBooking');

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Parse "HH:mm" to total minutes from midnight.
 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Format total minutes back to "HH:mm".
 */
function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Slot Generation ──────────────────────────────────────────────────────

/**
 * Generate BookingSlot records for a specific date based on section config.
 * Uses upsert so repeated calls are idempotent.
 *
 * @param {string} tenantId
 * @param {string|ObjectId} branchId
 * @param {string} date - "YYYY-MM-DD"
 * @param {{ slotStartTime: string, slotEndTime: string, slotIntervalMinutes: number, slotCapacity: number }} config
 * @returns {Promise<BookingSlot[]>} All slots for the date (including pre-existing ones).
 */
async function generateSlotsForDate(tenantId, branchId, date, config) {
  const { slotStartTime, slotEndTime, slotIntervalMinutes, slotCapacity } = config;

  const startMin = timeToMinutes(slotStartTime);
  const endMin = timeToMinutes(slotEndTime);
  const interval = slotIntervalMinutes;

  if (startMin >= endMin) {
    throw new Error('slotStartTime must be before slotEndTime');
  }

  const ops = [];
  for (let t = startMin; t + interval <= endMin; t += interval) {
    const startTime = minutesToTime(t);
    const endTime = minutesToTime(t + interval);

    ops.push({
      updateOne: {
        filter: { tenantId, branchId, date, startTime },
        update: {
          $setOnInsert: {
            tenantId,
            branchId,
            date,
            startTime,
            endTime,
            capacity: slotCapacity,
          },
        },
        upsert: true,
      },
    });
  }

  if (ops.length > 0) {
    await BookingSlot.bulkWrite(ops, { ordered: false });
  }

  // Return all slots for the date
  return BookingSlot.find({ tenantId, branchId, date })
    .sort({ startTime: 1 })
    .lean();
}

// ─── Availability ─────────────────────────────────────────────────────────

/**
 * Get available slots for a date with real-time occupancy.
 *
 * @param {string} tenantId
 * @param {string|ObjectId} branchId
 * @param {string} date - "YYYY-MM-DD"
 * @returns {Promise<Array<BookingSlot & { remaining: number }>>}
 */
async function getAvailableSlots(tenantId, branchId, date) {
  const slots = await BookingSlot.find({ tenantId, branchId, date })
    .sort({ startTime: 1 })
    .lean();

  if (slots.length === 0) return [];

  // Aggregate actual bookedCount from SlotBooking records
  const occupancy = await SlotBooking.aggregate([
    {
      $match: {
        tenantId,
        branchId: new mongoose.Types.ObjectId(branchId),
        date,
        status: { $in: ['pending', 'confirmed'] },
      },
    },
    {
      $group: {
        _id: { slotId: '$slotId' },
        totalBooked: { $sum: '$partySize' },
      },
    },
  ]);

  const occupancyMap = new Map();
  for (const row of occupancy) {
    occupancyMap.set(String(row._id.slotId), row.totalBooked);
  }

  return slots.map(slot => ({
    ...slot,
    bookedCount: occupancyMap.get(String(slot._id)) || 0,
    remaining: Math.max(0, slot.capacity - (occupancyMap.get(String(slot._id)) || 0)),
  }));
}

// ─── Find Next Available ──────────────────────────────────────────────────

/**
 * Scan forward from a given date/time to find the nearest upcoming slot
 * that still has capacity.
 *
 * @param {string} tenantId
 * @param {string|ObjectId} branchId
 * @param {string} fromDate - "YYYY-MM-DD" to start searching from
 * @param {string} fromTime - "HH:mm" to start searching from on fromDate (inclusive)
 * @param {number} [maxDays=30] - How many days forward to scan
 * @returns {Promise<{ slot: BookingSlot, remaining: number } | null>}
 */
async function findNextAvailable(tenantId, branchId, fromDate, fromTime, maxDays = 30) {
  const startDate = new Date(fromDate + 'T00:00:00');

  for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    const dateStr = currentDate.toISOString().split('T')[0];

    const slots = await getAvailableSlots(tenantId, branchId, dateStr);

    for (const slot of slots) {
      // On the first day, only include slots at or after fromTime
      if (dayOffset === 0 && slot.startTime < fromTime) continue;

      if (slot.remaining > 0) {
        return { slot, remaining: slot.remaining };
      }
    }
  }

  return null;
}

// ─── Booking ──────────────────────────────────────────────────────────────

/**
 * Atomically create a slot booking with capacity enforcement.
 *
 * Uses a read-then-write with conditional check. In production with
 * high concurrency, this should use a MongoDB transaction, but for the
 * expected load of tenant-level booking systems this is sufficient.
 *
 * @param {string} tenantId
 * @param {string|ObjectId} branchId
 * @param {string|ObjectId} slotId
 * @param {{ name: string, phone: string, email?: string, partySize: number, comment?: string, consents?: object }} bookingData
 * @returns {Promise<{ booking: SlotBooking, slot: BookingSlot } | { error: string }>}
 */
async function bookSlot(tenantId, branchId, slotId, bookingData) {
  const slot = await BookingSlot.findById(slotId);
  if (!slot) return { error: 'SLOT_NOT_FOUND' };
  if (slot.tenantId !== tenantId) return { error: 'FORBIDDEN' };

  // Compute current occupancy from SlotBooking records (authoritative)
  const occupancyResult = await SlotBooking.aggregate([
    {
      $match: {
        tenantId,
        branchId: new mongoose.Types.ObjectId(branchId),
        slotId: slot._id,
        status: { $in: ['pending', 'confirmed'] },
      },
    },
    {
      $group: {
        _id: null,
        totalBooked: { $sum: '$partySize' },
      },
    },
  ]);

  const currentBooked = occupancyResult.length > 0 ? occupancyResult[0].totalBooked : 0;
  const remaining = slot.capacity - currentBooked;

  if (bookingData.partySize > remaining) {
    return { error: 'SLOT_FULL', remaining };
  }

  // Create the booking
  const booking = new SlotBooking({
    tenantId,
    branchId: new mongoose.Types.ObjectId(branchId),
    slotId: slot._id,
    date: slot.date,
    startTime: slot.startTime,
    name: bookingData.name,
    phone: bookingData.phone,
    email: bookingData.email || '',
    partySize: bookingData.partySize,
    comment: bookingData.comment || '',
    status: 'pending',
  });

  await booking.save();

  // Atomically increment denormalized bookedCount on the slot
  const updatedSlot = await BookingSlot.findByIdAndUpdate(
    slotId,
    { $inc: { bookedCount: bookingData.partySize } },
    { new: true }
  );

  return { booking, slot: updatedSlot || slot };
}

// ─── Cancellation ─────────────────────────────────────────────────────────

/**
 * Cancel a slot booking and decrement the slot's bookedCount.
 *
 * @param {string|ObjectId} bookingId
 * @param {string} tenantId
 * @returns {Promise<{ success: boolean } | { error: string }>}
 */
async function cancelSlotBooking(bookingId, tenantId) {
  const booking = await SlotBooking.findById(bookingId);
  if (!booking) return { error: 'NOT_FOUND' };
  if (booking.tenantId !== tenantId) return { error: 'FORBIDDEN' };
  if (booking.status === 'cancelled') return { error: 'ALREADY_CANCELLED' };

  booking.status = 'cancelled';
  await booking.save();

  // Atomically decrement bookedCount on the slot
  await BookingSlot.findByIdAndUpdate(
    booking.slotId,
    { $inc: { bookedCount: -booking.partySize } }
  );

  return { success: true };
}

// ─── Admin: Get bookings for a slot ───────────────────────────────────────

/**
 * Get all active bookings for a specific slot.
 *
 * @param {string} tenantId
 * @param {string|ObjectId} slotId
 * @returns {Promise<SlotBooking[]>}
 */
async function getSlotBookings(tenantId, slotId) {
  return SlotBooking.find({
    tenantId,
    slotId,
    status: { $in: ['pending', 'confirmed'] },
  })
    .sort({ createdAt: 1 })
    .lean();
}

/**
 * Get all bookings (including cancelled) for a specific slot — admin view.
 *
 * @param {string} tenantId
 * @param {string|ObjectId} slotId
 * @returns {Promise<SlotBooking[]>}
 */
async function getAllSlotBookings(tenantId, slotId) {
  return SlotBooking.find({ tenantId, slotId })
    .sort({ createdAt: 1 })
    .lean();
}

module.exports = {
  timeToMinutes,
  minutesToTime,
  generateSlotsForDate,
  getAvailableSlots,
  findNextAvailable,
  bookSlot,
  cancelSlotBooking,
  getSlotBookings,
  getAllSlotBookings,
};
