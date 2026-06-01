import { useTenantAuthStore } from '../../store/tenantAuthStore';

export async function tenantApiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = useTenantAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useTenantAuthStore.getState().logout();
    window.location.href = '/login-client';
  }

  return response;
}