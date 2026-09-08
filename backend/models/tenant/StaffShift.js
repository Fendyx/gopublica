const mongoose = require('mongoose');

/**
 * StaffShift — explicit shift assignment for a specific date.
 *
 * When a shift exists for a staff member on a given date, it takes priority
 * over the weekly template (StaffMember.schedule). When no shift exists,
 * the calendar falls back to the weekly template for that day of week.
 *
 * Status flow: scheduled → confirmed → completed / cancelled
 */
const staffShiftSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, default: null, index: true },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffMember',
      required: true,
      index: true,
    },
    /** "YYYY-MM-DD" — local date, no timezone ambiguity */
    date: { type: String, required: true },
    /** "HH:mm" — shift start time */
    start: { type: String, required: true },
    /** "HH:mm" — shift end time */
    end: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

// Compound index for fast calendar queries: "all shifts for tenant X between date A and B"
staffShiftSchema.index({ tenantId: 1, date: 1 });
// Compound index for per-staff calendar: "all shifts for staff X between date A and B"
staffShiftSchema.index({ tenantId: 1, staffId: 1, date: 1 });

module.exports = mongoose.model('StaffShift', staffShiftSchema);
