const mongoose = require('mongoose');

const categoryTranslationSchema = new mongoose.Schema({
  key: { type: String, required: true },
  tenantId: { type: String, default: null, index: true },
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  translations: { type: Map, of: String, default: {} },
  addedByTenants: [{ type: String }],
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
  order: { type: Number, default: 0 },
  carouselAutoplay: { type: Boolean, default: false },
  productCardVariant: {
    type: String,
    enum: ['overlay', 'action-bar', 'minimal', 'hover-vertical', 'action-overlay', 'clean', null],
    default: null
  },
  productCardWidth: {
    type: String,
    enum: ['default', 'medium', 'large', 'xlarge', 'full'],
    default: 'default'
  }
});

categoryTranslationSchema.index({ key: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('CategoryTranslation', categoryTranslationSchema);