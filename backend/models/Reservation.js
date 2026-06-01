const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
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
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);