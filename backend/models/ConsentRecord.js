const mongoose = require('mongoose');

const consentRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TenantUser', required: true },
  type: {
    type: String,
    enum: ['terms', 'privacy', 'marketing'],
    required: true
  },
  granted: { type: Boolean, required: true },
  ip: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ConsentRecord', consentRecordSchema);