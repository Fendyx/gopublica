const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  name: String,
  phone: String,
  email: String,
  date: String,
  time: String,
  guests: Number,           // можно переименовать в clients, но оставим
  comment: String,
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'BeautyService', default: null },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('BeautyAppointment', appointmentSchema);