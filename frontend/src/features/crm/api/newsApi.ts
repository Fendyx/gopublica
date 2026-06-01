import type { NewsPost } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken(): string | null {
  return localStorage.getItem('token'); // у тебя такой же ключ?
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  return fetch(`${API_URL}${url}`, { ...options, headers });
}

export async function fetchNews(): Promise<NewsPost[]> {
  const res = await authFetch('/saas/news');
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

export async function createNews(data: {
  type: string;
  title: string;
  content: string;
  targetTenants?: string[];
  targetTariffs?: string[];
  showToNewClients?: boolean;
  expiresAt?: string | null;
}): Promise<NewsPost> {
  const res = await authFetch('/saas/news', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to create news');
  }
  return res.json();
}

export async function deleteNews(id: string): Promise<void> {
  const res = await authFetch(`/saas/news/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete news');
}