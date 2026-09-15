// ─── Tenant List Summary ─────────────────────────────────────────────────────
export interface TenantSummary {
  tenantId: string;
  businessName: string;
  domain: string;
  niche: 'food' | 'restaurant' | 'beauty' | 'auto' | 'ecommerce';
  status: string;
  userCount: number;
  branchCount: number;
  primaryCurrency: string;
  activeLocales: string[];
  createdAt: string;
}

// ─── TenantSettings (full, matches backend model) ─────────────────────────────
export interface TenantSettings {
  _id?: string;
  tenantId: string;
  businessName: string;
  logoUrl: string;
  faviconUrl: string;
  phone: string;
  address: string;
  email: string;
  hours: string;
  hoursI18n: Record<string, string>;
  googleMapsUrl: string;
  legal: {
    legalCompanyName: string;
    nip: string;
    regon: string;
    krs: string;
    representativeName: string;
    representativeRole: string;
    postalCode: string;
    city: string;
    showTerms: boolean;
    showPrivacy: boolean;
  };
  seoTitle: string;
  seoTitleI18n: Record<string, string>;
  seoDescription: string;
  seoDescriptionI18n: Record<string, string>;
  notifications: {
    booking: { sound: boolean; message: boolean; soundFile: string };
    telegram: {
      enabled: boolean;
      events: {
        newOrder: boolean;
        newReservation: boolean;
        newJobApplication: boolean;
        newPartnerRequest: boolean;
      };
      branchOverrides: Array<{
        branchId: string;
        events: Record<string, boolean>;
      }>;
    };
  };
  primaryLanguage: string;
  activeLocales: string[];
  defaultLocale: string;
  primaryCurrency: string;
  domain: string | null;
  aliases: string[];
  niche: string;
  businessType: string | null;
  moduleAccess: {
    orders: boolean | null;
    menu: boolean | null;
    reservations: boolean | null;
    gallery: boolean | null;
    news: boolean | null;
    jobs: boolean | null;
    team: boolean | null;
  };
  theme: {
    primary: string;
    accent: string;
    fontHeading: string;
    heroStyle: string;
    heroVideoUrl: string;
    heroPosterUrl: string;
    heroSliderImages: string[];
    heroBgImage: string;
    heroSplitImage: string;
    menuStyle: string;
    galleryStyle: string;
    ecommerceLayout: string;
    radius: string;
    productCardVariant: string;
    categoryBgColor: string;
    pageBgColor: string;
  };
  features: {
    hasMenu: boolean;
    hasBooking: boolean;
    hasGallery: boolean;
    hasDelivery: boolean;
    hasClickCollect: boolean;
    hasOnlineOrdering: boolean;
    hasJobApplications: boolean;
    showCategoryNav: boolean;
  };
  navigation: {
    items: Array<{
      id: string;
      type: string;
      slug: string;
      label: string;
      isVisible: boolean;
      placement: 'primary' | 'dropdown';
      order: number;
    }>;
    dropdownLabel: string;
  };
  payments: {
    stripeAccountId: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    onboardingComplete: boolean;
    platformFeePercent: number;
  };
  logistics: {
    enabled: boolean;
    provider: string;
    auth: { clientId: string; clientSecret: string; username: string; password: string };
    mapApiKey: string;
    env: string;
    tokens: { accessToken: string; refreshToken: string; expiresAt: string | null };
    defaults: { carrier: string };
  };
  deploymentStatus: string;
  deploymentUrl: string;
  liveUrl: string;
  lastDeployedAt: string | null;
  deploymentError: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Branch ──────────────────────────────────────────────────────────────────
export interface Branch {
  _id: string;
  tenantId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  workingHours: Record<string, string>;
  coordinates: { lat: number | null; lng: number | null };
  parentBranchId: string | null;
  venueType: 'main' | 'concept';
  settingsOverride: Record<string, any>;
  isActive: boolean;
  slug: string;
  customPages: Array<{ title: string; slug: string; isActive: boolean }>;
  createdAt?: string;
}

// ─── MenuItem ────────────────────────────────────────────────────────────────
export interface MenuItem {
  _id: string;
  tenantId: string;
  branchId: string | null;
  name: string;
  description?: string;
  price: number;
  categoryKey: string;
  image?: string;
  translations?: Record<string, any>;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  order?: number;
  productType?: string;
  status?: string;
  isFeatured?: boolean;
  sku?: string;
  stock?: number;
  variants?: any[];
  modifierGroups?: any[];
  attributes?: any[];
  attributeRefs?: any[];
  createdAt?: string;
}

// ─── CategoryTranslation ─────────────────────────────────────────────────────
export interface CategoryTranslation {
  _id: string;
  key: string;
  tenantId: string;
  name: string;
  translations?: Record<string, string>;
  icon?: string;
  niche?: string;
  order?: number;
  coverImage?: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export interface Order {
  _id: string;
  tenantId: string;
  branchId: string;
  customerId?: { _id: string; name: string; email: string; phone: string } | string;
  items: Array<{ name: string; price: number; quantity: number; [k: string]: any }>;
  status: string;
  pricing?: { total: number; [k: string]: any };
  confirmation?: { status: string; [k: string]: any };
  payment?: Record<string, any>;
  fulfillment?: Record<string, any>;
  createdAt: string;
}

// ─── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
  _id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  addresses?: any[];
  ordersCount?: number;
  totalSpent?: number;
  createdAt?: string;
}

// ─── Reservation ─────────────────────────────────────────────────────────────
export interface Reservation {
  _id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: number;
  status: string;
  createdAt?: string;
}

// ─── StaffMember ─────────────────────────────────────────────────────────────
export interface StaffMember {
  _id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  photo?: string;
  role?: string;
  email?: string;
  phone?: string;
  languages?: string[];
  specializations?: string[];
  schedule?: Record<string, any>;
  isActive: boolean;
  sortOrder?: number;
}

// ─── GalleryItem ─────────────────────────────────────────────────────────────
export interface GalleryItem {
  _id: string;
  tenantId: string;
  branchId?: string;
  image: string;
  caption?: string;
  order?: number;
}

// ─── Article ─────────────────────────────────────────────────────────────────
export interface Article {
  _id: string;
  tenantId: string;
  title: string;
  slug: string;
  coverImage?: string;
  body?: any;
  bodyFormat?: string;
  author?: string;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
}

// ─── TenantUser ──────────────────────────────────────────────────────────────
export interface TenantUser {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  companyName?: string;
  tenantId: string | null;
  role: string;
  isActive: boolean;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  createdAt?: string;
}

// ─── Subscription ────────────────────────────────────────────────────────────
export interface Subscription {
  _id: string;
  tenantId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  paymentHistory?: Array<{ amount: number; note: string; paidBy: string; date: string }>;
  createdAt?: string;
}

// ─── Site ────────────────────────────────────────────────────────────────────
export interface Site {
  _id: string;
  tenantId: string;
  name: string;
  type: string;
  domain?: string;
  subdomain?: string;
  status: string;
  niche?: string;
  stagingUrl?: string;
  liveUrl?: string;
  lastDeployedAt?: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface TenantAnalytics {
  orderCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  reservationCount: number;
  customerCount: number;
  menuItemCount: number;
  topItems: Array<{ _id: string; count: number; revenue: number }>;
  recentOrders: Order[];
}

// ─── Beauty Service ──────────────────────────────────────────────────────────
export interface BeautyService {
  _id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  price: number;
  durationMinutes: number;
  categoryKey?: string;
  translations?: Record<string, any>;
}

// ─── Beauty Master ───────────────────────────────────────────────────────────
export interface BeautyMaster {
  _id: string;
  tenantId: string;
  branchId?: string;
  name: string;
  languages?: string[];
  specializations?: string[];
  services?: string[];
  schedule?: Record<string, any>;
  timezone?: string;
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  items?: T[];
  orders?: T[];
  customers?: T[];
  reservations?: T[];
  articles?: T[];
}
