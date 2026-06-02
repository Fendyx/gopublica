import { tenantApiFetch } from '../../../shared/api/tenantApiClient';

export const tenantApi = {
  register: async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    companyName?: string;
    vatId?: string;
  }) => {
    const res = await fetch('/api/saas/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Ошибка регистрации');
    return json;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await fetch('/api/saas/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Ошибка входа');
    return json;
  },

  getMe: async () => {
    const res = await tenantApiFetch('/saas/auth/me');
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  },

  createSetupIntent: async () => {
    const res = await tenantApiFetch('/stripe/setup-intent', {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json; // { clientSecret: string }
  },

subscribeWithPaymentMethod: async (
    paymentMethodId: string,
    priceId: string,
    companyName?: string,
    vatId?: string,
    country?: string // <--- ДОБАВИЛИ СТРАНУ
  ) => {
    const res = await tenantApiFetch('/stripe/subscribe', {
      method: 'POST',
      // ДОБАВИЛИ COUNTRY В BODY
      body: JSON.stringify({ paymentMethodId, priceId, companyName, vatId, country }), 
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json;
  },
};