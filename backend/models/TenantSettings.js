const mongoose = require('mongoose');

const tenantSettingsSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true,
  },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  email: { type: String, default: '' },
  hours: { type: String, default: '' },
  googleMapsUrl: { type: String, default: '' },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  notifications: {
  booking: {
    sound: { type: Boolean, default: true },
    message: { type: Boolean, default: true },
    soundFile: { type: String, default: '' } // URL или пусто для дефолтного
  },
  primaryLanguage: {
    type: String,
    default: 'pl',
    enum: ['pl', 'en', 'de', 'ru', 'es', 'ua'] // расширяй по необходимости
  }
}
}, { timestamps: true });

module.exports = mongoose.model('TenantSettings', tenantSettingsSchema);