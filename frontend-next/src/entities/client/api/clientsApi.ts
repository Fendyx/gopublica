import { apiFetch } from '@/shared/api/apiClient';

export type ClientStatus = 'active' | 'paused' | 'churned';

export interface Client {
  _id?: string;
  email: string;
  name: string;
  phone: string;
  companyName: string;
  vatId: string;
  tenantId: string | null;
  role: 'client_admin' | 'client_manager';
  isActive: boolean;
  subscriptionStatus: string;
  subscriptionPlan: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientFormData {
  email: string;
  password?: string;
  name: string;
  phone: string;
  companyName: string;
  vatId: string;
  role: 'client_admin' | 'client_manager';
  isActive: boolean;
  tenantId: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
}

export const fetchClients = async (): Promise<Client[]> => {
  const res = await apiFetch('/saas/auth/users');
  if (!res.ok) throw new Error('Failed to fetch clients');
  return res.json();
};

export const createClient = async (data: ClientFormData): Promise<Client> => {
  const res = await apiFetch('/saas/auth/users', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create client');
  }
  return res.json();
};

export const updateClient = async (id: string, patch: Partial<ClientFormData>): Promise<Client> => {
  const res = await apiFetch(`/saas/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update client');
  }
  return res.json();
};

export const archiveClient = async (id: string): Promise<void> => {
  const res = await apiFetch(`/saas/auth/users/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to archive client');
  }
};
