const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  branchId: { type: String, required: true, index: true },
  name: String,
  phone: String,
  email: String,
  date: String,       // "2026-05-22"
  time: String,       // "19:00"
  guests: Number,
  comment: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },

  // ── GDPR: Proof-of-consent snapshot (embedded for immutable audit) ──
  _consent: {
    terms:     { type: Boolean, default: null },
    privacy:   { type: Boolean, default: null },
    marketing: { type: Boolean, default: false },
    ip:        { type: String, default: '' },
    userAgent: { type: String, default: '' },
    timestamp: { type: Date, default: null },
    version:   { type: String, default: '1.0' },
  },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);