import { apiFetch } from '@/shared/api/apiClient';
import type { PortfolioCase } from '@/entities/case/types';

export const portfolioApi = {
  // Public
  getAll: async (): Promise<PortfolioCase[]> => {
    const res = await apiFetch('/portfolio?published=true');
    return res.json();
  },
  getBySlug: async (slug: string): Promise<PortfolioCase> => {
    const res = await apiFetch(`/portfolio/${slug}`);
    return res.json();
  },

  // Admin CRUD
getAllAdmin: async (): Promise<PortfolioCase[]> => {
    const res = await apiFetch('/portfolio/admin');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('API Error:', err);
      throw new Error(err.error || 'Failed to fetch portfolio');
    }
    return res.json();
  },
  create: async (data: Omit<PortfolioCase, '_id' | 'createdAt'>): Promise<PortfolioCase> => {
    const res = await apiFetch('/portfolio/admin', { method: 'POST', body: JSON.stringify(data) });
    return res.json();
  },
  update: async (id: string, data: Partial<PortfolioCase>): Promise<PortfolioCase> => {
    const res = await apiFetch(`/portfolio/admin/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    await apiFetch(`/portfolio/admin/${id}`, { method: 'DELETE' });
  },
};