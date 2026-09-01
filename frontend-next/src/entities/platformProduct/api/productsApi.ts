import { apiFetch } from '@/shared/api/apiClient';
import type { PlatformProduct, PlatformProductFormData } from '../model/types';

export const fetchAllProducts = async (): Promise<PlatformProduct[]> => {
  const res = await apiFetch('/platform/products/all');
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

export const fetchProduct = async (id: string): Promise<PlatformProduct> => {
  const res = await apiFetch(`/platform/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
};

export const createProduct = async (data: PlatformProductFormData): Promise<PlatformProduct> => {
  const res = await apiFetch('/platform/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create product' }));
    throw new Error(err.error || 'Failed to create product');
  }
  return res.json();
};

export const updateProduct = async (id: string, data: Partial<PlatformProductFormData>): Promise<PlatformProduct> => {
  const res = await apiFetch(`/platform/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update product' }));
    throw new Error(err.error || 'Failed to update product');
  }
  return res.json();
};

export const deleteProduct = async (id: string): Promise<void> => {
  const res = await apiFetch(`/platform/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
};
