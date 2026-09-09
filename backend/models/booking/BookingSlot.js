const mongoose = require('mongoose');

/**
 * BookingSlot — represents a single time slot within a booking section's
 * configured time window for a given date.
 *
 * Example: A section configured with slotStartTime="14:00", slotEndTime="18:00",
 * slotIntervalMinutes=60 will produce slots: 14:00–15:00, 15:00–16:00,
 * 16:00–17:00, 17:00–18:00.
 *
 * `bookedCount` is denormalized here for fast reads. It is atomically
 * incremented/decremented by the slot booking service on create/cancel.
 */
const bookingSlotSchema = new mongoose.Schema(
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
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },
    startTime: {
      type: String, // "HH:mm"
      required: true,
    },
    endTime: {
      type: String, // "HH:mm"
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// One slot per time per branch per tenant per date
bookingSlotSchema.index(
  { tenantId: 1, branchId: 1, date: 1, startTime: 1 },
  { unique: true }
);

// Fast lookup for availability queries
bookingSlotSchema.index({ tenantId: 1, branchId: 1, date: 1 });

module.exports = mongoose.model('BookingSlot', bookingSlotSchema);
