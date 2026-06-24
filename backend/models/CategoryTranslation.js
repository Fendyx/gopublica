// backend/models/CategoryTranslation.js
const mongoose = require('mongoose');

const categoryTranslationSchema = new mongoose.Schema({
  key: { type: String, required: true }, // Убрали unique: true
  tenantId: { type: String, default: null, index: true }, // <--- НОВОЕ ПОЛЕ (null = глобальная)
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  translations: { type: Map, of: String, default: {} },
  addedByTenants: [{ type: String }], // Оставляем для совместимости со старыми глобальными
  icon: { type: String, default: '' },
  niche: {
    type: String,
    enum: ['food', 'beauty', 'auto', 'ecommerce'],
    default: 'food'
  },
  layout: {
    type: String,
    enum: ['grid-3', 'grid-4', 'carousel', 'dynamic', 'list'],
    default: 'grid-3'
  },
  coverImage: { type: String, default: '' },
  cardBgColor: { type: String, default: '' },
  imageAspectRatio: { type: String, default: '1/1' },
  productImageAspectRatio: { type: String, default: '1/1' },
});

// Составной индекс: ключ + тенант должны быть уникальными вместе
categoryTranslationSchema.index({ key: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('CategoryTranslation', categoryTranslationSchema);