import { apiFetch } from '@/shared/api/apiClient';
import type { CustomService } from '../model/types';

export interface CreateCustomServiceData {
  tenantId: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface UpdateCustomServiceData {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export const adminCustomServiceApi = {
  list: async (params?: { tenantId?: string; status?: string }): Promise<CustomService[]> => {
    const qs = new URLSearchParams();
    if (params?.tenantId) qs.set('tenantId', params.tenantId);
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    const res = await apiFetch(`/custom-services${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch custom services');
    return res.json();
  },

  getById: async (id: string): Promise<CustomService> => {
    const res = await apiFetch(`/custom-services/${id}`);
    if (!res.ok) throw new Error('Failed to fetch custom service');
    return res.json();
  },

  create: async (data: CreateCustomServiceData): Promise<CustomService> => {
    const res = await apiFetch('/custom-services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create custom service');
    }
    return res.json();
  },

  update: async (id: string, data: UpdateCustomServiceData): Promise<CustomService> => {
    const res = await apiFetch(`/custom-services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update custom service');
    }
    return res.json();
  },

  delete: async (id: string): Promise<void> => {
    const res = await apiFetch(`/custom-services/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete custom service');
    }
  },
};
