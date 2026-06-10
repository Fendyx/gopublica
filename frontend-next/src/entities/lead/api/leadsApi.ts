import { apiFetch } from '@/shared/api/apiClient';
import type { Lead, AdminUser } from '../model/types';

export const fetchLeads = async (): Promise<Lead[]> => {
  const res = await apiFetch('/leads');
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
};

export const fetchAdmins = async (): Promise<AdminUser[]> => {
  const res = await apiFetch('/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const createLead = async (data: Omit<Lead, '_id' | 'createdAt' | 'createdBy'>): Promise<Lead> => {
  const res = await apiFetch('/leads', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create lead');
  return res.json();
};

export const updateLead = async (id: string, patch: Partial<Lead>): Promise<Lead> => {
  const res = await apiFetch(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update lead');
  }
  return res.json();
};

export const deleteLead = async (id: string): Promise<void> => {
  const res = await apiFetch(`/leads/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to delete lead');
  }
};

export const importLeads = async (leads: any[], assignedTo: string | null, businessType: string) => {
  const res = await apiFetch('/leads/import', {
    method: 'POST',
    body: JSON.stringify({ leads, assignedTo, businessType }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Import failed');
  }
  return res.json();
};