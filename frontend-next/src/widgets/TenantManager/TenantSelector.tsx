'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, Building2, ChevronDown } from 'lucide-react';
import type { TenantSummary } from '@/entities/tenantAdmin/types';
import { fetchTenantsList } from '@/entities/tenantAdmin/api';

interface Props {
  selectedTenantId: string | null;
  onSelect: (tenantId: string) => void;
}

export default function TenantSelector({ selectedTenantId, onSelect }: Props) {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTenantsList();
      setTenants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.businessName.toLowerCase().includes(q) || t.domain.toLowerCase().includes(q) || t.tenantId.toLowerCase().includes(q);
  });

  const selected = tenants.find((t) => t.tenantId === selectedTenantId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left transition hover:border-[var(--primary-color)]/50"
      >
        <Building2 size={18} className="shrink-0 text-[var(--primary-color)]" />
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <div className="font-semibold truncate">{selected.businessName || 'Unnamed'}</div>
              <div className="text-xs text-[var(--text-muted)] truncate">
                {selected.domain || selected.tenantId} · {selected.niche} · {selected.branchCount} branches
              </div>
            </>
          ) : (
            <div className="text-[var(--text-muted)]">
              {loading ? 'Loading tenants…' : 'Select a tenant'}
            </div>
          )}
        </div>
        <ChevronDown size={16} className={`shrink-0 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
            <div className="p-2">
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                <Search size={14} className="shrink-0 text-[var(--text-muted)]" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tenants…"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 pt-0">
              {filtered.length === 0 ? (
                <div className="py-4 text-center text-sm text-[var(--text-muted)]">No tenants found</div>
              ) : (
                filtered.map((t) => (
                  <button
                    key={t.tenantId}
                    onClick={() => { onSelect(t.tenantId); setOpen(false); setSearch(''); }}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition ${t.tenantId === selectedTenantId ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)]' : 'hover:bg-[var(--bg)]'}`}
                  >
                    <div className="font-medium text-sm truncate">{t.businessName || 'Unnamed'}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {t.domain || t.tenantId} · {t.niche} · {t.userCount} users · {t.branchCount} branches
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
