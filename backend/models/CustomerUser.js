const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  
  // GDPR: Согласия
  consents: {
    terms: { type: Boolean, default: false },
    privacy: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    acceptedAt: { type: Date }, // Когда принял условия
  },
}, { timestamps: true });

// Метод для сравнения пароля
customerUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('CustomerUser', customerUserSchema);