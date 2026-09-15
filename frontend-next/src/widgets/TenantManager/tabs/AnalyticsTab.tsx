'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { fetchAnalytics } from '@/entities/tenantAdmin/api';
import type { TenantAnalytics } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function AnalyticsTab({ tenantId, key: _key }: Props) {
  const [data, setData] = useState<TenantAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchAnalytics(tenantId);
      setData(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;
  if (!data) return <div className="py-10 text-center text-sm text-red-500">Failed to load analytics</div>;

  const stats = [
    { label: 'Orders', value: data.orderCount, color: 'text-blue-600' },
    { label: 'Revenue', value: `${data.totalRevenue}`, color: 'text-emerald-600' },
    { label: 'Avg Order', value: `${data.avgOrderValue}`, color: 'text-purple-600' },
    { label: 'Reservations', value: data.reservationCount, color: 'text-orange-600' },
    { label: 'Customers', value: data.customerCount, color: 'text-pink-600' },
    { label: 'Menu Items', value: data.menuItemCount, color: 'text-gray-600' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2"><BarChart3 size={18} /> Analytics</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {data.topItems?.length ? (
        <div>
          <h4 className="text-sm font-semibold mb-2">Top Items</h4>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2 text-right">Quantity Sold</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((item, i) => (
                  <tr key={i} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2 font-medium">{item._id || '—'}</td>
                    <td className="px-4 py-2 text-right">{item.count}</td>
                    <td className="px-4 py-2 text-right font-medium">{item.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
