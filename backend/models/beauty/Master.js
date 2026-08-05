const mongoose = require('mongoose');

const weeklyScheduleEntrySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    start: { type: String, required: true, default: '09:00' },
    end: { type: String, required: true, default: '18:00' },
  },
  { _id: false },
);

const breakSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false },
);

const scheduleOverrideSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    type: { type: String, enum: ['day_off', 'custom_hours'], default: 'custom_hours' },
    start: { type: String, default: null },
    end: { type: String, default: null },
  },
  { _id: false },
);

const masterSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    branchId: { type: String, default: null, index: true },
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: '' },
    languages: [{ type: String, trim: true }],
    specializations: [{ type: String, trim: true }],
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BeautyService' }],
    schedule: {
      type: Map,
      of: [weeklyScheduleEntrySchema],
      default: {},
    },
    breaks: [breakSchema],
    overrides: [scheduleOverrideSchema],
    timezone: { type: String, default: 'Europe/Warsaw' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('BeautyMaster', masterSchema);