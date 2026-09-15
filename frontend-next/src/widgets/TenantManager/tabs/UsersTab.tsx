'use client';

import { useCallback, useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { fetchTenantUsers } from '@/entities/tenantAdmin/api';
import type { TenantUser } from '@/entities/tenantAdmin/types';

interface Props { tenantId: string; onRefresh: () => void; key: number }

export default function UsersTab({ tenantId, key: _key }: Props) {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTenantUsers(tenantId);
      setUsers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Shield size={18} /> Tenant Users ({users.length})</h3>
      {users.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-12 text-center text-[var(--text-muted)]">No users</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Plan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2 font-medium">{u.name || '—'}</td>
                  <td className="px-4 py-2 text-[var(--text-muted)]">{u.email}</td>
                  <td className="px-4 py-2"><span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">{u.role}</span></td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${u.isActive ? 'border-emerald-500/30 text-emerald-600' : 'border-red-500/30 text-red-600'}`}>
                      {u.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-[var(--text-muted)]">{u.subscriptionPlan || 'none'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
