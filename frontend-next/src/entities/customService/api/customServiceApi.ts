import { useTenantAuthStore } from '@/store/tenantAuthStore';
import type { CustomService } from '../model/types';

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

  let data: any;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    throw new Error(text || `Server returned ${res.status}`);
  }

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const customServiceApi = {
  list: (params?: { status?: string }): Promise<CustomService[]> => {
    const qs = params?.status ? `?status=${params.status}` : '';
    return authFetch(`/saas/custom-services${qs}`);
  },

  getById: (id: string): Promise<CustomService> =>
    authFetch(`/saas/custom-services/${id}`),

  pay: (id: string): Promise<{ clientSecret: string; paymentIntentId: string }> =>
    authFetch(`/saas/custom-services/${id}/pay`, { method: 'POST' }),
};
