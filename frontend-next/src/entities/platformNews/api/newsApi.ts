import { apiFetch } from '@/shared/api/apiClient';
import type { PlatformNews, PlatformNewsFormData } from '../model/types';

export const fetchAllNews = async (): Promise<PlatformNews[]> => {
  const res = await apiFetch('/platform/news/all');
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
};

export const fetchNewsItem = async (id: string): Promise<PlatformNews> => {
  const res = await apiFetch(`/platform/news/${id}`);
  if (!res.ok) throw new Error('Failed to fetch news item');
  return res.json();
};

export const createNews = async (data: PlatformNewsFormData): Promise<PlatformNews> => {
  const res = await apiFetch('/platform/news', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create news' }));
    throw new Error(err.error || 'Failed to create news');
  }
  return res.json();
};

export const updateNews = async (id: string, data: Partial<PlatformNewsFormData>): Promise<PlatformNews> => {
  const res = await apiFetch(`/platform/news/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update news' }));
    throw new Error(err.error || 'Failed to update news');
  }
  return res.json();
};

export const deleteNews = async (id: string): Promise<void> => {
  const res = await apiFetch(`/platform/news/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete news');
};
