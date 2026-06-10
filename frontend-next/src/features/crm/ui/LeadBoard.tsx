'use client';

import { useState, useMemo } from 'react';
import { Phone, MapPin, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { updateLead } from '@/entities/lead/api/leadsApi';
import {
  type Lead, type LeadStatus, type SortBy, type SortDir,
  STATUS_COLOR, STATUS_ICON, PRIORITY_COLOR, STATUSES, getAssignedName,
} from '@/entities/lead/model/types';
import { useAuthStore } from '@/store/authStore';

interface Props {
  leads: Lead[];
  loading: boolean;
  filter: LeadStatus | 'All';
  onFilterChange: (f: LeadStatus | 'All') => void;
  onSelectLead: (lead: Lead) => void;
  onLeadUpdated: (lead: Lead) => void;
}

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

const SortIcon = ({ col, sortBy, sortDir }: { col: SortBy; sortBy: SortBy; sortDir: SortDir }) => {
  if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
  return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
};

export default function LeadBoard({ leads, loading, filter, onFilterChange, onSelectLead, onLeadUpdated }: Props) {
  const { user } = useAuthStore();
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (col: SortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const filtered = filter === 'All' ? leads : leads.filter(l => l.status === filter);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortBy === 'city') cmp = (a.city || '').localeCompare(b.city || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortDir]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, lead: Lead) => {
    e.stopPropagation();
    try {
      const updated = await updateLead(lead._id!, { status: e.target.value as LeadStatus });
      onLeadUpdated(updated);
    } catch (err: any) { alert(err.message); }
  };

  const canEdit = (lead: Lead) => {
    if (user?.role === 'superadmin') return true;
    const assignedId = typeof lead.assignedTo === 'object' ? lead.assignedTo?._id : lead.assignedTo;
    return assignedId === user?.id;
  };

  const filterOptions: (LeadStatus | 'All')[] = ['All', ...STATUSES];

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
      {/* Toolbar */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg)] flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</span>
          <div className="flex gap-1.5 flex-wrap">
            {filterOptions.map(s => {
              const count = s === 'All' ? leads.length : leads.filter(l => l.status === s).length;
              const color = s !== 'All' ? STATUS_COLOR[s] : undefined;
              return (
                <button
                  key={s}
                  onClick={() => onFilterChange(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors
                    ${filter === s
                      ? 'shadow-sm'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]'
                    }`}
                  style={filter === s && color ? { backgroundColor: `${color}18`, color, borderColor: `${color}50` } : {}}
                >
                  {s !== 'All' && <span>{STATUS_ICON[s]}</span>}
                  {s}
                  {count > 0 && <span className="ml-1 text-[10px] opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Sort by</span>
          {(['date', 'status', 'city'] as SortBy[]).map(col => (
            <button
              key={col}
              onClick={() => toggleSort(col)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium border transition-colors
                ${sortBy === col ? 'border-[var(--primary-color)] text-[var(--primary-color)] bg-[var(--primary-color)]/5' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]'}`}
            >
              {col.charAt(0).toUpperCase() + col.slice(1)}
              <SortIcon col={col} sortBy={sortBy} sortDir={sortDir} />
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg)] border-b border-[var(--border)]">
              <th className="w-10 py-2 px-3 text-left text-xs font-bold uppercase text-[var(--text-muted)]">#</th>
              <th className="py-2 px-3 text-left text-xs font-bold uppercase text-[var(--text-muted)]">Client</th>
              <th className="py-2 px-3 text-left text-xs font-bold uppercase text-[var(--text-muted)]">Business</th>
              <th className="py-2 px-3 text-left text-xs font-bold uppercase text-[var(--text-muted)]">
                <button onClick={() => toggleSort('city')} className="inline-flex items-center gap-1 hover:text-[var(--primary-color)]">
                  City <SortIcon col="city" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
              <th className="py-2 px-3 text-left text-xs font-bold uppercase text-[var(--text-muted)]">Phone</th>
              <th className="py-2 px-3 text-left text-xs font-bold uppercase text-[var(--text-muted)]">Budget</th>
              <th className="py-2 px-3 text-left text-xs font-bold uppercase text-[var(--text-muted)]">Priority</th>
              <th className="py-2 px-3 text-left text-xs font-bold uppercase text-[var(--text-muted)]">Assigned</th>
              <th className="py-2 px-3 text-left text-xs font-bold uppercase text-[var(--text-muted)]">
                <button onClick={() => toggleSort('status')} className="inline-flex items-center gap-1 hover:text-[var(--primary-color)]">
                  Status <SortIcon col="status" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
              <th className="py-2 px-3 text-left text-xs font-bold uppercase text-[var(--text-muted)]">
                <button onClick={() => toggleSort('date')} className="inline-flex items-center gap-1 hover:text-[var(--primary-color)]">
                  Date <SortIcon col="date" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="py-16 text-center text-[var(--text-muted)]">Loading leads...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={10} className="py-16 text-center text-[var(--text-muted)]">No leads found</td></tr>
            ) : sorted.map((lead, idx) => (
              <tr
                key={lead._id}
                onClick={() => onSelectLead(lead)}
                className="border-b border-[var(--border)] hover:bg-[var(--bg)] cursor-pointer transition-colors"
              >
                <td className="py-2 px-3 text-center text-xs text-[var(--text-muted)] font-medium">{sorted.length - idx}</td>
                <td className="py-2 px-3 font-semibold text-[var(--text)]">{lead.name}</td>
                <td className="py-2 px-3 text-xs text-[var(--text-muted)]">{lead.businessType || '—'}</td>
                <td className="py-2 px-3 text-xs">
                  {lead.city ? (
                    <span className="inline-flex items-center gap-1 text-[var(--text-muted)]"><MapPin size={11} />{lead.city}</span>
                  ) : <span className="text-[var(--text-muted)]">—</span>}
                </td>
                <td className="py-2 px-3 text-xs text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1"><Phone size={11} />{lead.phone}</span>
                </td>
                <td className="py-2 px-3 text-xs font-medium">
                  {lead.price ? `$${lead.price.toLocaleString()}` : <span className="text-[var(--text-muted)]">—</span>}
                </td>
                <td className="py-2 px-3">
                  {lead.priority && (
                    <span className="text-xs font-semibold" style={{ color: PRIORITY_COLOR[lead.priority] }}>
                      {lead.priority === 'High' ? '🔴' : lead.priority === 'Medium' ? '🟡' : '⚪'} {lead.priority}
                    </span>
                  )}
                </td>
                <td className="py-2 px-3">
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] bg-[var(--bg)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                    👤 {getAssignedName(lead.assignedTo)}
                  </span>
                </td>
                <td className="py-2 px-3" onClick={e => e.stopPropagation()}>
                  {canEdit(lead) ? (
                    <select
                      value={lead.status}
                      onChange={e => handleStatusChange(e, lead)}
                      className="text-xs font-bold border rounded-md px-2 py-1 outline-none focus:ring-2"
                      style={{ color: STATUS_COLOR[lead.status], borderColor: `${STATUS_COLOR[lead.status]}50` }}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_ICON[s]} {s}</option>)}
                    </select>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border"
                      style={{ backgroundColor: `${STATUS_COLOR[lead.status]}12`, color: STATUS_COLOR[lead.status], borderColor: `${STATUS_COLOR[lead.status]}30` }}
                    >
                      {STATUS_ICON[lead.status]} {lead.status}
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 text-xs text-[var(--text-muted)] whitespace-nowrap">{fmt(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}