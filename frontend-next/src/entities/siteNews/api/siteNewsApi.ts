import { apiFetch } from '@/shared/api/apiClient';
import type { GoPublicaNews, GoPublicaNewsFormData } from '../model/types';

// ─── Server-side helper ───────────────────────────────────────────────────
// Server Components cannot use apiFetch (relative /api/ URLs don't go through
// Next.js rewrites on the server). Use BACKEND_URL directly.
const SERVER_BASE = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

async function serverFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${SERVER_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) throw new Error('NOT_FOUND');
    throw new Error(`Failed to fetch ${path}`);
  }
  return res.json();
}

// ─── Public API ────────────────────────────────────────────────────────────

export const fetchPublicNews = async (params?: {
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: GoPublicaNews[]; total: number; page: number; limit: number }> => {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  const res = await apiFetch(`/platform/site-news${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
};

export const fetchPinnedNews = async (): Promise<GoPublicaNews[]> => {
  const res = await apiFetch('/platform/site-news/pinned');
  if (!res.ok) throw new Error('Failed to fetch pinned news');
  return res.json();
};

/** Client-side (uses apiFetch → /api rewrite). */
export const fetchPublicNewsBySlug = async (slug: string): Promise<GoPublicaNews> => {
  const res = await apiFetch(`/platform/site-news/slug/${slug}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('NOT_FOUND');
    throw new Error('Failed to fetch news');
  }
  return res.json();
};

/** Server-side (direct backend call — use in Server Components). */
export const fetchPublicNewsBySlugServer = async (slug: string): Promise<GoPublicaNews> => {
  return serverFetch<GoPublicaNews>(`/api/platform/site-news/slug/${encodeURIComponent(slug)}`);
};

// ─── Admin API ─────────────────────────────────────────────────────────────

export const fetchAllSiteNews = async (params?: {
  category?: string;
  isActive?: boolean;
}): Promise<GoPublicaNews[]> => {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
  const qs = searchParams.toString();
  const res = await apiFetch(`/platform/site-news/all${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
};

export const fetchSiteNewsItem = async (id: string): Promise<GoPublicaNews> => {
  const res = await apiFetch(`/platform/site-news/${id}`);
  if (!res.ok) throw new Error('Failed to fetch news item');
  return res.json();
};

export const createSiteNews = async (data: GoPublicaNewsFormData): Promise<GoPublicaNews> => {
  const res = await apiFetch('/platform/site-news', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create news' }));
    throw new Error(err.error || 'Failed to create news');
  }
  return res.json();
};

export const updateSiteNews = async (
  id: string,
  data: Partial<GoPublicaNewsFormData>,
): Promise<GoPublicaNews> => {
  const res = await apiFetch(`/platform/site-news/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update news' }));
    throw new Error(err.error || 'Failed to update news');
  }
  return res.json();
};

export const deleteSiteNews = async (id: string): Promise<void> => {
  const res = await apiFetch(`/platform/site-news/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete news');
};
