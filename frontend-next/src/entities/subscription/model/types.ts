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