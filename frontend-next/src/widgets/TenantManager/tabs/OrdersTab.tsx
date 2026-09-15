'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '@/entities/tenantAdmin/api';
import type { Order } from '@/entities/tenantAdmin/types';

const STATUS_OPTIONS = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'border-yellow-500/30 text-yellow-600',
  accepted: 'border-blue-500/30 text-blue-600',
  preparing: 'border-orange-500/30 text-orange-600',
  ready: 'border-emerald-500/30 text-emerald-600',
  completed: 'border-gray-500/30 text-gray-600',
  cancelled: 'border-red-500/30 text-red-600',
};

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function OrdersTab({ tenantId, key: _key }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchOrders(tenantId, { page, limit: 50, status: statusFilter || undefined });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId, page, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      const updated = await updateOrderStatus(tenantId, orderId, status);
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: updated.status } : o));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2"><ShoppingCart size={18} /> Orders ({total})</h3>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:opacity-50">Prev</button>
          <span className="text-xs text-[var(--text-muted)]">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={orders.length < 50}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:opacity-50">Next</button>
        </div>
      </div>
      {orders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-12 text-center text-[var(--text-muted)]">No orders</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Items</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2 text-xs text-[var(--text-muted)]">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    {typeof o.customerId === 'object' && o.customerId ? (
                      <span>{o.customerId.name || o.customerId.email || '—'}</span>
                    ) : <span className="text-[var(--text-muted)]">Guest</span>}
                  </td>
                  <td className="px-4 py-2">{o.items?.length || 0} items</td>
                  <td className="px-4 py-2 text-right font-medium">{o.pricing?.total ?? '—'}</td>
                  <td className="px-4 py-2">
                    <select value={o.status} onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      className={`rounded-full border px-2 py-0.5 text-xs bg-transparent ${STATUS_COLORS[o.status] || 'border-gray-300'}`}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-right text-xs text-[var(--text-muted)]">
                    {o._id.slice(-6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
