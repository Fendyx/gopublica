// src/entities/demoRequest/api/demoRequestsApi.ts
import { apiFetch } from '@/shared/api/apiClient';
import type { DemoRequestPayload, DemoRequestResponse } from '../model/types';

/**
 * Submit a public "Get a Free Demo" request.
 *
 * NOTE: `apiFetch` attaches the admin JWT if present, but the public
 * demo endpoint does NOT require auth — so this works for anonymous
 * visitors too. The 401 auto-redirect only triggers on a 401 response,
 * which this endpoint never returns.
 */
export async function submitDemoRequest(
  payload: DemoRequestPayload
): Promise<DemoRequestResponse> {
  const res = await apiFetch('/public/demo-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!res.ok) {
    let message = 'Failed to submit demo request';
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }

  return res.json();
}
