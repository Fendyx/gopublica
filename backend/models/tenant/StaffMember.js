const mongoose = require('mongoose');
const { weeklyScheduleEntrySchema, breakSchema, scheduleOverrideSchema } = require('../schemas/schedule');

const staffMemberSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, default: null, index: true },
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: '' },
    role: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    languages: [{ type: String, trim: true }],
    specializations: [{ type: String, trim: true }],
    schedule: {
      type: Map,
      of: [weeklyScheduleEntrySchema],
      default: {},
    },
    breaks: [breakSchema],
    overrides: [scheduleOverrideSchema],
    timezone: { type: String, default: 'Europe/Warsaw' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('StaffMember', staffMemberSchema);
