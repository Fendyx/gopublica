import { useAuthStore } from '@/store/authStore';

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`/api${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/admin/login'; // или '/admin/login' — поправим позже
    throw new Error('Unauthorized');
  }
  return res;
}