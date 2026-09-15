'use client';

import { useCallback, useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { fetchSites } from '@/entities/tenantAdmin/api';
import type { Site } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function SitesTab({ tenantId, key: _key }: Props) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSites(tenantId);
      setSites(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Globe size={18} /> Sites ({sites.length})</h3>
      {sites.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-12 text-center text-[var(--text-muted)]">No sites</div>
      ) : (
        <div className="space-y-3">
          {sites.map((s) => (
            <div key={s._id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{s.type} · {s.domain || s.subdomain || 'No domain'}</div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${
                  s.status === 'live' ? 'border-emerald-500/30 text-emerald-600' :
                  s.status === 'error' ? 'border-red-500/30 text-red-600' :
                  'border-gray-300 text-gray-500'
                }`}>{s.status}</span>
              </div>
              {s.liveUrl && <div className="mt-2 text-xs"><a href={s.liveUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--primary-color)] hover:underline">{s.liveUrl}</a></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
