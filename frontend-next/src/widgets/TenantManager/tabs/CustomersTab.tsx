'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { fetchCustomers } from '@/entities/tenantAdmin/api';
import type { Customer } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function CustomersTab({ tenantId, key: _key }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCustomers(tenantId, { page, limit: 50, q: q || undefined });
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId, page, q]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Users size={18} /> Customers ({total})</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search…"
              className="bg-transparent text-xs outline-none" />
          </div>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:opacity-50">Prev</button>
          <span className="text-xs text-[var(--text-muted)]">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={customers.length < 50}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:opacity-50">Next</button>
        </div>
      </div>
      {customers.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-12 text-center text-[var(--text-muted)]">No customers</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2 text-right">Orders</th>
                <th className="px-4 py-2 text-right">Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2 font-medium">{c.name || '—'}</td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">{c.email || '—'}</td>
                  <td className="px-4 py-2">{c.phone || '—'}</td>
                  <td className="px-4 py-2 text-right">{c.ordersCount ?? 0}</td>
                  <td className="px-4 py-2 text-right font-medium">{c.totalSpent ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
