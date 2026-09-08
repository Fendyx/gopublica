const mongoose = require('mongoose');

/**
 * Shared schedule sub-schemas used by both BeautyMaster and StaffMember.
 * Extracted to avoid duplication while keeping both models decoupled.
 */

const weeklyScheduleEntrySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      // Not required — the day is already encoded as the Map key.
      // Kept for backward compat with any data that stores it explicitly.
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

module.exports = { weeklyScheduleEntrySchema, breakSchema, scheduleOverrideSchema };
