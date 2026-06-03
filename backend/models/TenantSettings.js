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
  hours: { type: String, default: '' },          // основной язык
  hoursI18n: { type: Map, of: String, default: {} }, // переводы часов
  googleMapsUrl: { type: String, default: '' },
  seoTitle: { type: String, default: '' },       // основной язык
  seoTitleI18n: { type: Map, of: String, default: {} }, // переводы seo title
  seoDescription: { type: String, default: '' },
  seoDescriptionI18n: { type: Map, of: String, default: {} },
  notifications: {
    booking: {
      sound: { type: Boolean, default: true },
      message: { type: Boolean, default: true },
      soundFile: { type: String, default: '' }
    }
  },
  primaryLanguage: {
    type: String,
    default: 'pl',
    enum: ['pl', 'en', 'de', 'ru', 'es', 'ua']
  },
  primaryCurrency: {
    type: String,
    default: 'PLN',
    enum: ['PLN', 'EUR', 'USD', 'UAH', 'GBP', 'CZK', 'CHF']
  }
}, { timestamps: true });

module.exports = mongoose.model('TenantSettings', tenantSettingsSchema);