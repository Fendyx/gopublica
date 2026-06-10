import { useTenantAuthStore } from '@/store/tenantAuthStore';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = useTenantAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    useTenantAuthStore.getState().logout();
    window.location.href = '/login-client';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const tenantApi = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    companyName?: string;
    vatId?: string;
    termsAccepted?: boolean;
    privacyAccepted?: boolean;
    marketingConsent?: boolean;
  }) =>
    authFetch('/saas/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    authFetch('/saas/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => authFetch('/saas/auth/me'),

  createSetupIntent: () => authFetch('/stripe/setup-intent', { method: 'POST' }),

  subscribeWithPaymentMethod: (
    paymentMethodId: string,
    priceId: string,
    companyName?: string,
    vatId?: string,
    country?: string
  ) =>
    authFetch('/stripe/subscribe', {
      method: 'POST',
      body: JSON.stringify({ paymentMethodId, priceId, companyName, vatId, country }),
    }),

  cancelSubscription: () =>
    authFetch('/stripe/cancel-subscription', { method: 'POST' }),
};