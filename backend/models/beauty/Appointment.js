const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  clientName: String,
  clientPhone: String,
  clientEmail: String,
  date: String,            // "2026-06-05"
  time: String,            // "14:30"
  duration: Number,        // суммарная длительность в минутах
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BeautyService' }],
  masterId: { type: mongoose.Schema.Types.ObjectId, ref: 'BeautyMaster', default: null },
  notes: String,
  // Поля питомца
  petName: String,
  petSpecies: String,      // dog, cat, etc.
  petBreed: String,
  petSize: String,         // small, medium, large
  petNotes: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('BeautyAppointment', appointmentSchema);