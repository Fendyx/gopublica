import { apiFetch } from '@/shared/api/apiClient';
import type {
  TenantSummary, TenantSettings, Branch, MenuItem, CategoryTranslation,
  Order, Customer, Reservation, StaffMember, GalleryItem, Article,
  TenantUser, Subscription, Site, TenantAnalytics,
  BeautyService, BeautyMaster, PaginatedResponse,
} from './types';

const BASE = '/gopublica/tenants';

// ─── Tenant List ─────────────────────────────────────────────────────────────
export async function fetchTenantsList(): Promise<TenantSummary[]> {
  const res = await apiFetch(`${BASE}/list`);
  if (!res.ok) throw new Error('Failed to fetch tenants');
  return res.json();
}

// ─── Settings ────────────────────────────────────────────────────────────────
export async function fetchTenantSettings(tenantId: string): Promise<TenantSettings> {
  const res = await apiFetch(`${BASE}/settings?tenantId=${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateTenantSettings(tenantId: string, data: Partial<TenantSettings>): Promise<TenantSettings> {
  const res = await apiFetch(`${BASE}/settings?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update settings');
  }
  return res.json();
}

// ─── Branches ────────────────────────────────────────────────────────────────
export async function fetchBranches(tenantId: string): Promise<Branch[]> {
  const res = await apiFetch(`${BASE}/branches?tenantId=${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error('Failed to fetch branches');
  return res.json();
}

export async function createBranch(tenantId: string, data: Partial<Branch>): Promise<Branch> {
  const res = await apiFetch(`${BASE}/branches?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create branch');
  return res.json();
}

export async function updateBranch(tenantId: string, branchId: string, data: Partial<Branch>): Promise<Branch> {
  const res = await apiFetch(`${BASE}/branches/${branchId}?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update branch');
  return res.json();
}

export async function deleteBranch(tenantId: string, branchId: string): Promise<void> {
  const res = await apiFetch(`${BASE}/branches/${branchId}?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete branch');
}

// ─── Menu ────────────────────────────────────────────────────────────────────
export async function fetchMenuItems(tenantId: string, params?: { branchId?: string; categoryKey?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<MenuItem> & { items: MenuItem[] }> {
  const sp = new URLSearchParams({ tenantId });
  if (params?.branchId) sp.set('branchId', params.branchId);
  if (params?.categoryKey) sp.set('categoryKey', params.categoryKey);
  if (params?.status) sp.set('status', params.status);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const res = await apiFetch(`${BASE}/menu?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch menu');
  return res.json();
}

export async function updateMenuItem(tenantId: string, itemId: string, data: Partial<MenuItem>): Promise<MenuItem> {
  const res = await apiFetch(`${BASE}/menu/${itemId}?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update menu item');
  return res.json();
}

export async function deleteMenuItem(tenantId: string, itemId: string): Promise<void> {
  const res = await apiFetch(`${BASE}/menu/${itemId}?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete menu item');
}

// ─── Categories ──────────────────────────────────────────────────────────────
export async function fetchCategories(tenantId: string): Promise<CategoryTranslation[]> {
  const res = await apiFetch(`${BASE}/categories?tenantId=${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export async function fetchOrders(tenantId: string, params?: { status?: string; page?: number; limit?: number; from?: string; to?: string }): Promise<PaginatedResponse<Order> & { orders: Order[] }> {
  const sp = new URLSearchParams({ tenantId });
  if (params?.status) sp.set('status', params.status);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  const res = await apiFetch(`${BASE}/orders?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function updateOrderStatus(tenantId: string, orderId: string, status: string): Promise<Order> {
  const res = await apiFetch(`${BASE}/orders/${orderId}/status?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

// ─── Customers ───────────────────────────────────────────────────────────────
export async function fetchCustomers(tenantId: string, params?: { q?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Customer> & { customers: Customer[] }> {
  const sp = new URLSearchParams({ tenantId });
  if (params?.q) sp.set('q', params.q);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const res = await apiFetch(`${BASE}/customers?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

// ─── Reservations ────────────────────────────────────────────────────────────
export async function fetchReservations(tenantId: string, params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Reservation> & { reservations: Reservation[] }> {
  const sp = new URLSearchParams({ tenantId });
  if (params?.status) sp.set('status', params.status);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const res = await apiFetch(`${BASE}/reservations?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch reservations');
  return res.json();
}

export async function updateReservation(tenantId: string, id: string, data: Partial<Reservation>): Promise<Reservation> {
  const res = await apiFetch(`${BASE}/reservations/${id}?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update reservation');
  return res.json();
}

// ─── Staff ───────────────────────────────────────────────────────────────────
export async function fetchStaff(tenantId: string, branchId?: string): Promise<StaffMember[]> {
  const sp = new URLSearchParams({ tenantId });
  if (branchId) sp.set('branchId', branchId);
  const res = await apiFetch(`${BASE}/staff?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch staff');
  return res.json();
}

// ─── Gallery ─────────────────────────────────────────────────────────────────
export async function fetchGallery(tenantId: string, branchId?: string): Promise<GalleryItem[]> {
  const sp = new URLSearchParams({ tenantId });
  if (branchId) sp.set('branchId', branchId);
  const res = await apiFetch(`${BASE}/gallery?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch gallery');
  return res.json();
}

// ─── Articles ────────────────────────────────────────────────────────────────
export async function fetchArticles(tenantId: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Article> & { articles: Article[] }> {
  const sp = new URLSearchParams({ tenantId });
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const res = await apiFetch(`${BASE}/articles?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch articles');
  return res.json();
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function fetchTenantUsers(tenantId: string): Promise<TenantUser[]> {
  const res = await apiFetch(`${BASE}/users?tenantId=${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error('Failed to fetch tenant users');
  return res.json();
}

// ─── Subscriptions ───────────────────────────────────────────────────────────
export async function fetchSubscription(tenantId: string): Promise<Subscription | null> {
  const res = await apiFetch(`${BASE}/subscriptions?tenantId=${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error('Failed to fetch subscription');
  const data = await res.json();
  return data || null;
}

export async function updateSubscription(tenantId: string, subId: string, data: Partial<Subscription>): Promise<Subscription> {
  const res = await apiFetch(`${BASE}/subscriptions/${subId}?tenantId=${encodeURIComponent(tenantId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update subscription');
  return res.json();
}

// ─── Sites ───────────────────────────────────────────────────────────────────
export async function fetchSites(tenantId: string): Promise<Site[]> {
  const res = await apiFetch(`${BASE}/sites?tenantId=${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error('Failed to fetch sites');
  return res.json();
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export async function fetchAnalytics(tenantId: string, params?: { from?: string; to?: string }): Promise<TenantAnalytics> {
  const sp = new URLSearchParams({ tenantId });
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  const res = await apiFetch(`${BASE}/analytics?${sp}`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

// ─── Beauty ──────────────────────────────────────────────────────────────────
export async function fetchBeautyServices(tenantId: string): Promise<BeautyService[]> {
  const res = await apiFetch(`${BASE}/beauty/services?tenantId=${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error('Failed to fetch beauty services');
  return res.json();
}

export async function fetchBeautyMasters(tenantId: string): Promise<BeautyMaster[]> {
  const res = await apiFetch(`${BASE}/beauty/masters?tenantId=${encodeURIComponent(tenantId)}`);
  if (!res.ok) throw new Error('Failed to fetch beauty masters');
  return res.json();
}
