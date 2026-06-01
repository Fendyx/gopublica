import { apiFetch } from '../../../shared/api/apiClient';

export interface Client {
  _id: string;
  leadId?: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  businessType: string;
  websiteUrl: string;
  source: string;
  assignedTo: string;
  status: 'active' | 'paused' | 'churned';
  notes: string;
  stripeCustomerId: string | null;
  subscription?: Subscription;
  changeRequests?: ChangeRequest[];
  createdAt?: string;
}

// НОВАЯ модель подписки — отражает TenantUser
export interface Subscription {
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  subscriptionStatus: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  subscriptionPlan: 'none' | 'basic' | 'pro';
  currentPeriodEnd: string | null;
}

export interface ChangeRequest {
  _id: string;
  clientId: string | { _id: string; name: string; businessType: string };
  title: string;
  description: string;
  status: 'new' | 'approved' | 'in_progress' | 'done' | 'rejected';
  price: number;
  billable: boolean;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string;
  completedAt: string | null;
  createdAt?: string;
}

// ── Clients ──────────────────────────────────────────

export const fetchClients = async (): Promise<Client[]> => {
  const res = await apiFetch('/clients');
  if (!res.ok) throw new Error('Failed to fetch clients');
  return res.json();
};

export const fetchClient = async (id: string): Promise<Client> => {
  const res = await apiFetch(`/clients/${id}`);
  if (!res.ok) throw new Error('Failed to fetch client');
  return res.json();
};

export const updateClient = async (
  id: string,
  patch: Partial<Client>
): Promise<Client> => {
  const res = await apiFetch(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to update client');
  return res.json();
};

// ── Change Requests ───────────────────────────────────

export const fetchChangeRequests = async (
  clientId?: string,
  status?: string
): Promise<ChangeRequest[]> => {
  const params = new URLSearchParams();
  if (clientId) params.append('clientId', clientId);
  if (status)   params.append('status', status);
  const res = await apiFetch(`/change-requests?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch change requests');
  return res.json();
};

export const createChangeRequest = async (
  data: Omit<ChangeRequest, '_id' | 'completedAt' | 'createdAt'>
): Promise<ChangeRequest> => {
  const res = await apiFetch('/change-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create change request');
  return res.json();
};

export const updateChangeRequest = async (
  id: string,
  patch: Partial<ChangeRequest>
): Promise<ChangeRequest> => {
  const res = await apiFetch(`/change-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to update change request');
  return res.json();
};

export const deleteChangeRequest = async (id: string): Promise<void> => {
  const res = await apiFetch(`/change-requests/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete change request');
};