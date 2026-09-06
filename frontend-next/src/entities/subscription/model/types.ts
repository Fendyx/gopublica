export interface TenantUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  tenantId: string | null;
  subscriptionStatus: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  subscriptionPlan: 'none' | 'basic' | 'pro';
  currentPeriodEnd: string | null;
  companyName?: string;
  vatId?: string;
  stripeCustomerId?: string;
}

export interface PaymentMethod {
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  cardholderName: string | null;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'failed' | 'open' | 'void' | 'uncollectible';
  description: string | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

export type SiteType = 'primary' | 'subdomain' | 'landing' | 'microsite';
export type SiteStatus = 'building' | 'staging' | 'live' | 'error' | 'paused';
export type SiteNiche = 'food' | 'restaurant' | 'beauty' | 'auto' | 'ecommerce';

export interface DeploymentLog {
  status: string;
  url?: string;
  error?: string;
  createdAt: string;
}

export interface Site {
  id: string;
  tenantId: string;
  name: string;
  type: SiteType;
  domain?: string;
  subdomain?: string;
  status: SiteStatus;
  stagingUrl?: string;
  liveUrl?: string;
  niche: SiteNiche;
  theme?: Record<string, any>;
  lastDeployedAt?: string;
  deploymentLogs?: DeploymentLog[];
  isActive: boolean;
  createdUnderPlan?: 'none' | 'basic' | 'pro';
  createdAt: string;
  updatedAt: string;
}

export interface SitesResponse {
  sites: Site[];
  legacyDomain?: string | null;
}

export interface SiteLimitCheck {
  allowed: boolean;
  currentCount: number;
  maxSites: number;
  plan: 'none' | 'basic' | 'pro';
  reason?: string;
}

export interface CreateSiteData {
  name: string;
  type?: SiteType;
  niche: SiteNiche;
  subdomain?: string;
  domain?: string;
}
