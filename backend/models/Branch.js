const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    default: 'Основной',
  },
  city: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  workingHours: {
    type: Map,
    of: String,
    default: {},
  },
  deliveryFee: { type: Number, default: 0 },           // стоимость доставки
  minOrderAmountForDelivery: { type: Number, default: 0 }, // мин. сумма для доставки
  deliveryRadiusKm: { type: Number, default: null },   // радиус доставки
  hasOnlineOrdering: { type: Boolean, default: null },  // null = наследуется от тенанта
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },

  // ─── НОВОЕ: "подфилии" ──────────────────────────────────────────────────────
  // Если у филиала указан parentBranchId — это подфилия/под-заведение внутри
  // того же здания, что и родительский филиал (например, веганское кафе
  // в подвале того же дома, что и "Kocia Kawiarnia").
  // venueType 'main'    — обычный самостоятельный филиал (по умолчанию)
  // venueType 'concept' — под-заведение, отображается вложенно под родителем
  parentBranchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  venueType: {
    type: String,
    enum: ['main', 'concept'],
    default: 'main',
  },

  // Переопределение настроек для конкретного филиала (поверх TenantSettings)
  settingsOverride: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    googleMapsUrl: { type: String, default: '' },
    hours: { type: String, default: '' },        // текстовое представление (для совместимости)
    hoursI18n: { type: Map, of: String, default: {} },
    seoTitle: { type: String, default: '' },
    seoTitleI18n: { type: Map, of: String, default: {} },
    seoDescription: { type: String, default: '' },
    seoDescriptionI18n: { type: Map, of: String, default: {} },
    primaryLanguage: { type: String, default: '' },
    primaryCurrency: { type: String, default: '' },

    // Фичи, специфичные для конкретного филиала.
    // hasVeganTeaser — включает 2-й слайд Hero "скоро открытие" ТОЛЬКО
    // для того филиала (Branch-документа), где этот флаг стоит true.
    features: {
      hasVeganTeaser: { type: Boolean, default: false },
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

branchSchema.index({ parentBranchId: 1 });

module.exports = mongoose.model('Branch', branchSchema);