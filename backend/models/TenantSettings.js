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
  // Канонический (основной) домен клиента: "sushi-master.com" или "sushi.gopublica.com"
  // Глобально уникален. Для локальной разработки или staging добавляются aliases.
  domain: { type: String, unique: true, sparse: true, default: null },

  // Дополнительные домены (алиасы), по которым тенант должен отвечать.
  // Используются для локальной разработки, staging, технических доменов платформы.
  // Любой элемент массива глобально уникален во всей коллекции (см. pre('save') хук).
  aliases: {
    type: [String],
    default: [],
    validate: {
      validator: function (arr) {
        return arr && arr.length <= 10;
      },
      message: 'Aliases array must not exceed 10 items',
    },
  },

  // Ниша — определяет какой шаблон рендерить на фронте
  niche: {
    type: String,
    enum: ['food', 'restaurant', 'beauty', 'auto', 'ecommerce'],
    default: 'food',
  },
  businessType: {
    type: String,
    enum: ['food', 'restaurant', 'beauty', 'auto', 'ecommerce'],
    default: null,
  },

  // Разрешённые модули для данного тенанта. Если не заданы явно,
  // используются значения по умолчанию для ниши.
  moduleAccess: {
    orders: { type: Boolean, default: null },
    menu: { type: Boolean, default: null },
    reservations: { type: Boolean, default: null },
    gallery: { type: Boolean, default: null },
    news: { type: Boolean, default: null },
    jobs: { type: Boolean, default: null },
  },

  // ─── НОВОЕ: Тема (вместо site.config.ts) ────────────────────────────────────
  theme: {
    primary:      { type: String, default: '#ff0505' },
    accent:       { type: String, default: '#F1A208' },
    fontHeading:  { type: String, default: 'playfair' },
    heroStyle: {
      type: String,
      enum: ['centered', 'split', 'video', 'slider', 'image-bg', 'compact'],
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

  // ─── НОВОЕ: Логистика и интеграция с Furgonetka ───────────────────────────
  logistics: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, enum: ['furgonetka', 'none'], default: 'none' },
    
    // Учетные данные API Фургонетки для этого магазина
    auth: {
      clientId: { type: String, default: '' },
      clientSecret: { type: String, default: '' },
      username: { type: String, default: '' },
      password: { type: String, default: '' },
    },
    
    // Автоматически обновляемые OAuth токены
    tokens: {
      accessToken: { type: String, default: '' },
      refreshToken: { type: String, default: '' },
      expiresAt: Date,
    },
    
    defaults: {
      carrier: { type: String, default: 'inpost' },
    },
  },

  // ─── НОВОЕ: Статус деплоя сайта (для обратной совместимости) ────────────────
  deploymentStatus: {
    type: String,
    enum: ['pending', 'building', 'staging', 'live', 'error', 'paused'],
    default: 'pending',
  },
  deploymentUrl: { type: String, default: '' },        // staging/preview URL
  liveUrl: { type: String, default: '' },              // production URL (может отличаться от domain)
  lastDeployedAt: { type: Date, default: null },
  deploymentError: { type: String, default: '' },

}, { timestamps: true });

// Индекс для быстрого поиска по домену
// proxy.ts вызывает этот запрос при каждом входящем запросе
tenantSettingsSchema.index({ domain: 1 });
tenantSettingsSchema.index({ aliases: 1 });

// ─── Pre-save hook: глобальная уникальность domain + aliases ──────────────────
// Нельзя, чтобы два тенанта имели одинаковый domain ИЛИ одинаковый alias.
// Проверяем пересечения как по domain, так и по aliases (в обе стороны).
tenantSettingsSchema.pre('save', async function (next) {
  if (!this.isModified('domain') && !this.isModified('aliases')) {
    return next();
  }

  const Model = this.constructor;
  const hostnames = new Set();
  if (this.domain) hostnames.add(this.domain.toLowerCase().trim());
  if (Array.isArray(this.aliases)) {
    this.aliases.forEach(a => {
      if (a) hostnames.add(a.toLowerCase().trim());
    });
  }

  if (hostnames.size === 0) {
    return next(); // ни домена, ни алисов — нечего проверять
  }

  const hostArray = Array.from(hostnames);

  // Ищем другие документы, которые имеют пересечение по domain или aliases
  const duplicate = await Model.countDocuments({
    _id: { $ne: this._id },
    $or: [
      { domain: { $in: hostArray } },
      { aliases: { $in: hostArray } },
    ],
  });

  if (duplicate > 0) {
    return next(new Error('Domain or alias is already in use by another tenant'));
  }

  // Нормализуем aliases (lowercase, trim, dedup)
  if (Array.isArray(this.aliases)) {
    this.aliases = [...new Set(this.aliases
      .filter(a => a && typeof a === 'string')
      .map(a => a.toLowerCase().trim())
    )];
  }

  next();
});

// ─── Revalidation Hooks (MUST be registered BEFORE mongoose.model() compiles) ──
const { registerRevalidationHooks } = require('../services/modelHooks');

registerRevalidationHooks(tenantSettingsSchema, {
  modelName: 'TenantSettings',
  getTags: (doc) => {
    const tags = [
      `settings:${doc.tenantId}`,
      `theme:${doc.tenantId}`,
      `modules:${doc.tenantId}`,
    ];
    if (doc.domain) tags.push(`tenant:domain:${doc.domain}`);
    if (Array.isArray(doc.aliases)) {
      doc.aliases.forEach(alias => {
        if (alias) tags.push(`tenant:domain:${alias}`);
      });
    }
    return tags;
  },
  getEntityId: (doc) => doc.tenantId,
});

const TenantSettings = mongoose.model('TenantSettings', tenantSettingsSchema);

module.exports = TenantSettings;