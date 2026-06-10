// Серверный API-клиент для взаимодействия с Express (будет использоваться в серверных экшенах и route handlers)
export const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    // Перенаправление на логин произойдёт на клиенте, на сервере просто вернём 401
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}