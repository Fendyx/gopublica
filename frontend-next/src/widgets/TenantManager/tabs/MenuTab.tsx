'use client';

import { useCallback, useEffect, useState } from 'react';
import { UtensilsCrossed, Trash2 } from 'lucide-react';
import { fetchMenuItems, deleteMenuItem } from '@/entities/tenantAdmin/api';
import type { MenuItem } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function MenuTab({ tenantId, key: _key }: Props) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMenuItems(tenantId, { page, limit: 50 });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId, page]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteMenuItem(tenantId, id);
      setItems((prev) => prev.filter((i) => i._id !== id));
      setTotal((t) => t - 1);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><UtensilsCrossed size={18} /> Menu Items ({total})</h3>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:opacity-50">Prev</button>
          <span className="py-1.5 text-xs text-[var(--text-muted)]">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={items.length < 50}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:opacity-50">Next</button>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-12 text-center text-[var(--text-muted)]">No menu items</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">{item.categoryKey || '—'}</td>
                  <td className="px-4 py-2 text-right">{item.price} {''}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${
                      item.status === 'published' ? 'border-emerald-500/30 text-emerald-600' : 'border-gray-300 text-gray-500'
                    }`}>{item.status || 'published'}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => handleDelete(item._id)} className="rounded p-1 text-red-500 hover:bg-red-50 transition">
                      <Trash2 size={14} />
                    </button>
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
