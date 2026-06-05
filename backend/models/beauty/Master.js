const mongoose = require('mongoose');

const masterSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  photo: { type: String, default: '' },
  languages: [{ type: String }],           // ['pl', 'en', 'de']
  specializations: [{ type: String }],     // ['стрижки', 'окрашивание']
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BeautyService' }],
  workingDays: [{ type: String }],         // ['Monday', 'Wednesday', ...]
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('BeautyMaster', masterSchema);