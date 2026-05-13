const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  phone: { type: String, required: true },
  source: { type: String, default: '' },
  comment: { type: String, default: '' },

  status: {
    type: String,
    enum: ['New', 'In Progress', 'Closed', 'Rejected'],
    default: 'New',
  },

  price:        { type: Number, default: 0 },
  businessType: { type: String, default: 'Other' },
  servicesRequested: [{ type: String }],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  followUpAt: { type: Date, default: null },

  // ── Кто создал лид (неизменяемое поле) ──────────────────────────────────
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // ── Кому назначен (можно переназначить) ─────────────────────────────────
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);