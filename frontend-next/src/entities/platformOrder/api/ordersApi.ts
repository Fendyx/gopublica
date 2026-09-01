import { apiFetch } from '@/shared/api/apiClient';
import type { PlatformOrder } from '../model/types';

export const fetchAllOrders = async (filters?: { status?: string; paymentMethod?: string; tenantId?: string }): Promise<PlatformOrder[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
  if (filters?.tenantId) params.set('tenantId', filters.tenantId);
  const qs = params.toString();
  const res = await apiFetch(`/platform/orders${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
};

export const fetchOrder = async (id: string): Promise<PlatformOrder> => {
  const res = await apiFetch(`/platform/orders/${id}`);
  if (!res.ok) throw new Error('Failed to fetch order');
  return res.json();
};

export const updateOrderStatus = async (id: string, status: string): Promise<PlatformOrder> => {
  const res = await apiFetch(`/platform/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
};

export const markOrderAsPaid = async (id: string): Promise<PlatformOrder> => {
  const res = await apiFetch(`/platform/orders/${id}/payment`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Failed to mark order as paid');
  return res.json();
};

export const updateOrderNotes = async (id: string, fulfillmentNotes: string): Promise<PlatformOrder> => {
  const res = await apiFetch(`/platform/orders/${id}/notes`, {
    method: 'PUT',
    body: JSON.stringify({ fulfillmentNotes }),
  });
  if (!res.ok) throw new Error('Failed to update notes');
  return res.json();
};
