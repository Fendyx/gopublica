const mongoose = require('mongoose');
const { LOCALE_CODES } = require('../config/locales');

const tenantSettingsSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    unique: true,
  },

  businessName: { type: String, default: '' },

  // ─── Branding: логотип и фавикон ──────────────────────────────────────────────
  logoUrl:    { type: String, default: '' },
  faviconUrl: { type: String, default: '' },

  // ─── Контактные данные (было) ───────────────────────────────────────────────
  phone:          { type: String, default: '' },
  address:        { type: String, default: '' },
  email:          { type: String, default: '' },
  hours:          { type: String, default: '' },
  hoursI18n:      { type: Map, of: String, default: {} },
  googleMapsUrl:  { type: String, default: '' },

  // ─── НОВОЕ: Польские юридические данные (для автогенерации Regulamin / Polityka) ──
  legal: {
    legalCompanyName: { type: String, default: '' },
    nip: {
      type: String,
      default: '',
      validate: {
        validator: v => !v || /^\d{10}$/.test(v),
        message: 'NIP musi składać się z 10 cyfr',
      },
    },
    regon: {
      type: String,
      default: '',
      validate: {
        validator: v => !v || /^\d{9}$/.test(v) || /^\d{14}$/.test(v),
        message: 'REGON musi składać się z 9 lub 14 cyfr',
      },
    },
    krs: {
      type: String,
      default: '',
      validate: {
        validator: v => !v || /^\d{10}$/.test(v),
        message: 'KRS musi składać się z 10 cyfr',
      },
    },
    representativeName: { type: String, default: '' },
    representativeRole: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    city: { type: String, default: '' },
    showTerms:   { type: Boolean, default: true },
    showPrivacy: { type: Boolean, default: true },
  },

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
    // ─── Telegram Bot Notifications ───────────────────────────────────────────
    telegram: {
      enabled: { type: Boolean, default: false },
      events: {
        newOrder: { type: Boolean, default: true },
        newReservation: { type: Boolean, default: true },
        newJobApplication: { type: Boolean, default: true },
        newPartnerRequest: { type: Boolean, default: true },
      },
      // Per-branch override (optional, for multi-branch tenants)
      branchOverrides: [{
        branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        events: {
          newOrder: Boolean,
          newReservation: Boolean,
          newJobApplication: Boolean,
          newPartnerRequest: Boolean,
        }
      }]
    },
  },

  // ─── Локализация ──────────────────────────────────────────────────────────
  // @deprecated Use `activeLocales` + `defaultLocale` instead. Kept for backward compat.
  primaryLanguage: {
    type: String,
    default: 'pl',
    enum: LOCALE_CODES,
  },

  /**
   * Locales that this tenant has enabled for content translation.
   * Admin forms render tabs / inputs only for the codes in this array.
   * Must contain at least one entry; every entry must be a valid global locale code.
   */
  activeLocales: {
    type: [String],
    default: ['pl', 'en'],
    validate: {
      validator: function (arr) {
        if (!arr || arr.length === 0) return false;
        return arr.every((code) => LOCALE_CODES.includes(code));
      },
      message: 'activeLocales must be a non-empty array of valid locale codes',
    },
  },

  /**
   * The primary / fallback locale for this tenant. Must be one of `activeLocales`.
   * Used for fallback resolution when a translation is missing.
   */
  defaultLocale: {
    type: String,
    default: 'pl',
    validate: {
      validator: function (code) {
        return LOCALE_CODES.includes(code);
      },
      message: 'defaultLocale must be a valid locale code',
    },
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

  // Ниша - определяет какой шаблон рендерить на фронте
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
    team: { type: Boolean, default: null },
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
      enum: ['overlay', 'action-bar', 'minimal', 'horizontal', 'action-overlay', 'clean', 'badge-top', 'split-action'],
      default: 'action-bar'
    },
    pdpGalleryLayout: {
      type: String,
      enum: ['classic', 'thumbnails-left', 'stacked-grid', 'lookbook'],
      default: 'classic',
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
    showCategoryNav: { type: Boolean, default: false },
    hasSearch:       { type: Boolean, default: false },
    // ── Mobile Bottom Navigation (optional, ecommerce only) ────────────────────
    bottomNav: {
      enabled: { type: Boolean, default: false },
      items: [{
        id:    { type: String, required: true },
        type:  { type: String, enum: ['home', 'catalog', 'search', 'profile', 'custom', 'external'], required: true },
        slug:  { type: String, default: '' },
        href:  { type: String, default: '' },
        label: { type: String, default: '' },
        icon:  { type: String, default: '' },
        isVisible: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      }],
    },
  },

  // ─── НОВОЕ: Конфигурация навигации (порядок ссылок, видимость, primary/dropdown) ──
  navigation: {
    items: [{
      id:    { type: String, required: true },
      type:  { type: String, enum: ['home', 'system', 'custom', 'external'], required: true },
      slug:  { type: String, required: true },
      label: { type: String, default: '' },
      isVisible:  { type: Boolean, default: true },
      placement:  { type: String, enum: ['primary', 'dropdown'], default: 'primary' },
      order:      { type: Number, default: 0 },
    }],
    dropdownLabel: { type: String, default: '' },
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
    
    // API-ключ для фронтенд-виджета карты (JWT, отдельный от OAuth-учетных данных)
    mapApiKey: { type: String, default: '' },
    
    // Окружение: sandbox (тестовое) или production (боевое)
    env: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
    
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

// ─── Pre-validate hook: defaultLocale must be one of activeLocales ──────────
tenantSettingsSchema.pre('validate', function () {
  if (this.isModified('activeLocales') || this.isModified('defaultLocale')) {
    if (this.activeLocales && this.activeLocales.length > 0) {
      if (!this.activeLocales.includes(this.defaultLocale)) {
        // Auto-correct: if defaultLocale is not in activeLocales, use the first active locale
        this.defaultLocale = this.activeLocales[0];
      }
    }
  }
});

// ─── Pre-save hook: глобальная уникальность domain + aliases ──────────────────
// Нельзя, чтобы два тенанта имели одинаковый domain ИЛИ одинаковый alias.
// Проверяем пересечения как по domain, так и по aliases (в обе стороны).
// NOTE: This hook is declared as `async` (no `next` callback). Mongoose
// automatically treats async middleware as promise-based - passing `next`
// would make it undefined and crash with "next is not a function".
tenantSettingsSchema.pre('save', async function () {
  if (!this.isModified('domain') && !this.isModified('aliases')) {
    return;
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
    return; // ни домена, ни алисов - нечего проверять
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
    throw new Error('Domain or alias is already in use by another tenant');
  }

  // Нормализуем aliases (lowercase, trim, dedup)
  if (Array.isArray(this.aliases)) {
    this.aliases = [...new Set(this.aliases
      .filter(a => a && typeof a === 'string')
      .map(a => a.toLowerCase().trim())
    )];
  }
});

// ─── Revalidation Hooks (MUST be registered BEFORE mongoose.model() compiles) ──
const { registerRevalidationHooks } = require('../services/content/modelHooks');

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