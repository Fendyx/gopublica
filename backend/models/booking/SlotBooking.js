const mongoose = require('mongoose');

/**
 * SlotBooking — an individual reservation for a specific BookingSlot.
 *
 * `partySize` is the number of spots this booking consumes from the slot's
 * capacity. When a booking is created, the parent Slot's `bookedCount` is
 * atomically incremented by `partySize`. On cancellation it is decremented.
 *
 * `date` and `startTime` are denormalized from BookingSlot for efficient
 * querying without joins.
 */
const slotBookingSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookingSlot',
      required: true,
      index: true,
    },
    date: {
      type: String, // "YYYY-MM-DD" — denormalized from BookingSlot
      required: true,
    },
    startTime: {
      type: String, // "HH:mm" — denormalized from BookingSlot
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    partySize: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    comment: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },

    // ── GDPR: Proof-of-consent snapshot ──
    _consent: {
      terms: { type: Boolean, default: null },
      privacy: { type: Boolean, default: null },
      marketing: { type: Boolean, default: false },
      ip: { type: String, default: '' },
      userAgent: { type: String, default: '' },
      timestamp: { type: Date, default: null },
      version: { type: String, default: '1.0' },
    },
  },
  { timestamps: true }
);

// Capacity aggregation: sum(partySize) WHERE status IN (pending, confirmed)
slotBookingSchema.index({ tenantId: 1, branchId: 1, date: 1, startTime: 1, status: 1 });

// Admin slot view: all bookings for a slot
slotBookingSchema.index({ tenantId: 1, slotId: 1, status: 1 });

module.exports = mongoose.model('SlotBooking', slotBookingSchema);
