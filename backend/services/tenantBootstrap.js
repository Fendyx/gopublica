const TenantSettings = require('../models/TenantSettings');
const { buildTenantModuleAccess } = require('./moduleAccess');

const DEFAULT_THEME = {
  primary: '#0a0a0a',
  accent: '#d4af37',
  fontHeading: 'playfair',
  heroStyle: 'image-bg',
  heroVideoUrl: '',
  heroPosterUrl: '',
  heroSliderImages: [],
  heroBgImage: '',
  heroSplitImage: '',
  menuStyle: 'grid',
  galleryStyle: 'bento',
  ecommerceLayout: 'grid-3',
  radius: 'lg',
  productCardVariant: 'action-bar',
  categoryBgColor: '',
  pageBgColor: '',
};

const DEFAULT_FEATURES = {
  hasMenu: true,
  hasBooking: true,
  hasGallery: true,
  hasDelivery: false,
  hasClickCollect: false,
  hasOnlineOrdering: false,
  hasJobApplications: false,
};

function buildDefaultTenantSettings({ tenantId, businessName = '', niche = 'beauty', phone = '', email = '' }) {
  const normalizedNiche = niche || 'beauty';
  const access = buildTenantModuleAccess({ niche: normalizedNiche });

  return {
    tenantId,
    businessName,
    phone,
    email,
    domain: null, // боевой домен задаётся вручную
    aliases: [`${tenantId}.temp-domain.com`], // технический домен для разработки
    niche: normalizedNiche,
    businessType: normalizedNiche,
    moduleAccess: {
      orders: access.orders,
      menu: access.menu,
      reservations: access.reservations,
      gallery: access.gallery,
      news: access.news,
      jobs: access.jobs,
    },
    theme: { ...DEFAULT_THEME },
    features: { ...DEFAULT_FEATURES },
  };
}

async function ensureTenantSettings({ tenantId, businessName, niche, phone, email }) {
  if (!tenantId) return null;

  const existing = await TenantSettings.findOne({ tenantId });
  if (existing) return existing;

  const defaults = buildDefaultTenantSettings({ tenantId, businessName, niche, phone, email });
  const settings = await TenantSettings.create(defaults);
  return settings;
}

module.exports = {
  buildDefaultTenantSettings,
  ensureTenantSettings,
  DEFAULT_THEME,
  DEFAULT_FEATURES,
};
