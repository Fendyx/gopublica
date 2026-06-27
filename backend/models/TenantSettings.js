const mongoose = require('mongoose');

const tenantSettingsSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true,
  },

  businessName: { type: String, default: '' },

  // ─── Контактные данные (было) ───────────────────────────────────────────────
  phone:          { type: String, default: '' },
  address:        { type: String, default: '' },
  email:          { type: String, default: '' },
  hours:          { type: String, default: '' },
  hoursI18n:      { type: Map, of: String, default: {} },
  googleMapsUrl:  { type: String, default: '' },

  // ─── SEO (было) ─────────────────────────────────────────────────────────────
  seoTitle:            { type: String, default: '' },
  seoTitleI18n:        { type: Map, of: String, default: {} },
  seoDescription:      { type: String, default: '' },
  seoDescriptionI18n:  { type: Map, of: String, default: {} },

  // ─── Уведомления (было) ─────────────────────────────────────────────────────
  notifications: {
    booking: {
      sound:     { type: Boolean, default: true },
      message:   { type: Boolean, default: true },
      soundFile: { type: String,  default: '' },
    },
  },

  // ─── Локализация (было) ─────────────────────────────────────────────────────
  primaryLanguage: {
    type: String,
    default: 'pl',
    enum: ['pl', 'en', 'de', 'ru', 'es', 'ua'],
  },
  primaryCurrency: {
    type: String,
    default: 'PLN',
    enum: ['PLN', 'EUR', 'USD', 'UAH', 'GBP', 'CZK', 'CHF'],
  },

  // ─── НОВОЕ: Multi-tenant роутинг ────────────────────────────────────────────
  // Домен клиента: "sushi-master.com" или "sushi.gopublica.com"
  domain: { type: String, unique: true, sparse: true, default: null },

  // Ниша — определяет какой шаблон рендерить на фронте
    // Ниша — определяет какой шаблон рендерить на фронте
  niche: {
    type: String,
    enum: ['food', 'beauty', 'auto', 'ecommerce'], // <--- ДОБАВЬ СЮДА 'ecommerce'
    default: 'food',
  },

  // ─── НОВОЕ: Тема (вместо site.config.ts) ────────────────────────────────────
  theme: {
    primary:      { type: String, default: '#ff0505' },
    accent:       { type: String, default: '#F1A208' },
    fontHeading:  { type: String, default: 'playfair' },
    heroStyle: {
      type: String,
      enum: ['video', 'slider', 'centered', 'split', 'image-bg'],
      default: 'video',
    },
    heroVideoUrl:      { type: String, default: '' },
    heroPosterUrl:     { type: String, default: '' },
    heroSliderImages:  [String],
    heroBgImage:       { type: String, default: '' },
    heroSplitImage: { type: String, default: '' },
    menuStyle:   { type: String, enum: ['grid', 'list'],          default: 'grid' },
    galleryStyle:{ type: String, enum: ['bento', 'masonry'],      default: 'bento' },
    ecommerceLayout: {
      type: String,
      enum: ['grid-3', 'grid-4', 'carousel', 'dynamic'],
      default: 'grid-3'
    },
    radius: {
      type: String,
      enum: ['none', 'sm', 'md', 'lg', 'xl'],
      default: 'lg'
    },
        productCardVariant: {
      type: String,
     enum: ['overlay', 'action-bar', 'minimal', 'hover-vertical', 'action-overlay', 'clean'],
      default: 'action-bar'
    },
    categoryBgColor: { type: String, default: '' }, 
    pageBgColor: { type: String, default: '' },
  },

  // ─── НОВОЕ: Фичи клиента ────────────────────────────────────────────────────
  features: {
    hasMenu:         { type: Boolean, default: true },
    hasBooking:      { type: Boolean, default: true },
    hasGallery:      { type: Boolean, default: true },
    hasDelivery:     { type: Boolean, default: false },
    hasClickCollect: { type: Boolean, default: false },
    hasOnlineOrdering: { type: Boolean, default: false },
    hasJobApplications: { type: Boolean, default: false },
  },

  payments: {
  stripeAccountId:      { type: String, default: '' },
  chargesEnabled:       { type: Boolean, default: false },
  payoutsEnabled:       { type: Boolean, default: false },
  onboardingComplete:   { type: Boolean, default: false },
  platformFeePercent:   { type: Number, default: 5 },    // наша комиссия 5%
},

}, { timestamps: true });

// Индекс для быстрого поиска по домену
// proxy.ts вызывает этот запрос при каждом входящем запросе
tenantSettingsSchema.index({ domain: 1 });

module.exports = mongoose.model('TenantSettings', tenantSettingsSchema);