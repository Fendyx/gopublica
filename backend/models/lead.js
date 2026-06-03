const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  phone: { type: String, required: true },
  source: { type: String, default: '' },
  comment: { type: String, default: '' },

  // ── Новые поля ───────────────────────────────────────────────────────────
  city:          { type: String, default: '' },
  businessHours: { type: String, default: '' },   // пример: "09:00–22:00, Пн–Вс"

  status: {
    type: String,
    enum: [
      'New',
      'In Progress',
      'Closed',
      'Rejected',
      'Call Back',      // они попросили перезвонить
      'No Answer',      // не берут трубку
      'Website Down',   // сайт не работает
      'Bad Website',    // сайт плохой
    ],
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

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);