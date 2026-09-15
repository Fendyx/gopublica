'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { fetchBeautyServices, fetchBeautyMasters } from '@/entities/tenantAdmin/api';
import type { BeautyService, BeautyMaster } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function BeautyTab({ tenantId, key: _key }: Props) {
  const [services, setServices] = useState<BeautyService[]>([]);
  const [masters, setMasters] = useState<BeautyMaster[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [s, m] = await Promise.all([fetchBeautyServices(tenantId), fetchBeautyMasters(tenantId)]);
      setServices(s);
      setMasters(m);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="space-y-6">
      {/* Services */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><Sparkles size={18} /> Beauty Services ({services.length})</h3>
        {services.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-8 text-center text-[var(--text-muted)]">No beauty services</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Duration</th>
                  <th className="px-4 py-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s._id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2 font-medium">{s.name}</td>
                    <td className="px-4 py-2 text-right">{s.price}</td>
                    <td className="px-4 py-2 text-right">{s.durationMinutes} min</td>
                    <td className="px-4 py-2 text-[var(--text-muted)]">{s.categoryKey || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Masters */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3"><Sparkles size={18} /> Masters ({masters.length})</h3>
        {masters.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-8 text-center text-[var(--text-muted)]">No beauty masters</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {masters.map((m) => (
              <div key={m._id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-color)]/10 text-sm font-bold text-[var(--primary-color)]">
                    {m.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="font-medium">{m.name}</div>
                </div>
                {m.specializations?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.specializations.map((spec, i) => (
                      <span key={i} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">{spec}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
