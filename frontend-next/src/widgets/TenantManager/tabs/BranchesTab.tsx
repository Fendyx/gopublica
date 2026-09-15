'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Trash2, MapPin } from 'lucide-react';
import { fetchBranches, deleteBranch } from '@/entities/tenantAdmin/api';
import type { Branch } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function BranchesTab({ tenantId, key: _key }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBranches(tenantId);
      setBranches(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this branch?')) return;
    try {
      await deleteBranch(tenantId, id);
      setBranches((prev) => prev.filter((b) => b._id !== id));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Building2 size={18} /> Branches ({branches.length})</h3>
      </div>
      {branches.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-12 text-center text-[var(--text-muted)]">No branches</div>
      ) : (
        <div className="grid gap-3">
          {branches.map((b) => (
            <div key={b._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-color)]/10">
                  <MapPin size={18} className="text-[var(--primary-color)]" />
                </div>
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{b.city || 'No city'} · {b.address || 'No address'} · slug: {b.slug}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs ${b.isActive ? 'border-emerald-500/30 text-emerald-600' : 'border-red-500/30 text-red-600'}`}>
                  {b.isActive ? 'active' : 'inactive'}
                </span>
                <button onClick={() => handleDelete(b._id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
