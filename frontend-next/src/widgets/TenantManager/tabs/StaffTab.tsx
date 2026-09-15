'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import { fetchStaff } from '@/entities/tenantAdmin/api';
import type { StaffMember } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function StaffTab({ tenantId, key: _key }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchStaff(tenantId);
      setStaff(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><UserCog size={18} /> Staff ({staff.length})</h3>
      {staff.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-12 text-center text-[var(--text-muted)]">No staff members</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((s) => (
            <div key={s._id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-color)]/10 text-sm font-bold text-[var(--primary-color)]">
                  {s.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{s.role || 'Staff'}</div>
                </div>
              </div>
              {s.email && <div className="mt-2 text-xs text-[var(--text-muted)]">{s.email}</div>}
              {s.phone && <div className="text-xs text-[var(--text-muted)]">{s.phone}</div>}
              {s.specializations?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.specializations.map((spec, i) => (
                    <span key={i} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">{spec}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
