import { useState, useMemo } from 'react';
import { Phone, MapPin, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  type Lead, type LeadStatus, type SortBy, type SortDir,
  STATUS_COLOR, STATUS_ICON, PRIORITY_COLOR, STATUSES, updateLead, getAssignedName,
} from '../../api/leadsApi';
import { useAuthStore } from '../../../../store/store';
import './LeadBoard.css';

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
  if (sortBy !== col) return <ArrowUpDown size={12} className="sort-icon sort-icon-inactive" />;
  return sortDir === 'asc'
    ? <ArrowUp size={12} className="sort-icon sort-icon-active" />
    : <ArrowDown size={12} className="sort-icon sort-icon-active" />;
};

export default function LeadBoard({
  leads, loading, filter, onFilterChange, onSelectLead, onLeadUpdated,
}: Props) {
  const { user } = useAuthStore();
  const [sortBy, setSortBy]   = useState<SortBy>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (col: SortBy) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const filtered = filter === 'All' ? leads : leads.filter(l => l.status === filter);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortBy === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortBy === 'city') {
        cmp = (a.city || '').localeCompare(b.city || '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortDir]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, lead: Lead) => {
    e.stopPropagation();
    try {
      const updated = await updateLead(lead._id!, { status: e.target.value as LeadStatus });
      onLeadUpdated(updated);
    }
    catch (err: any) { alert(err.message); }
  };

  const canEdit = (lead: Lead) => {
    if (user?.role === 'superadmin') return true;
    const assignedId = typeof lead.assignedTo === 'object' ? lead.assignedTo?._id : lead.assignedTo;
    return assignedId === user?.id;
  };

  const filterOptions: (LeadStatus | 'All')[] = ['All', ...STATUSES];

  return (
    <div className="lead-board">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="board-toolbar">
        <div className="filter-row">
          <span className="filter-label">Status</span>
          <div className="filter-pills">
            {filterOptions.map(s => {
              const count = s === 'All' ? leads.length : leads.filter(l => l.status === s).length;
              const color = s !== 'All' ? STATUS_COLOR[s] : undefined;
              return (
                <button key={s} onClick={() => onFilterChange(s)}
                  className={`filter-pill ${filter === s ? 'filter-pill-active' : ''}`}
                  style={filter === s && color ? { background: `${color}18`, color, borderColor: `${color}50` } : {}}>
                  {s !== 'All' && <span>{STATUS_ICON[s]}</span>}
                  {s}
                  {count > 0 && <span className="pill-count">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sort-row">
          <span className="filter-label">Sort by</span>
          {(['date', 'status', 'city'] as SortBy[]).map(col => (
            <button key={col} onClick={() => toggleSort(col)}
              className={`sort-btn ${sortBy === col ? 'sort-btn-active' : ''}`}>
              {col.charAt(0).toUpperCase() + col.slice(1)}
              <SortIcon col={col} sortBy={sortBy} sortDir={sortDir} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="table-wrapper">
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Client</th>
              <th>Business</th>
              <th>
                <button className="th-sort" onClick={() => toggleSort('city')}>
                  City <SortIcon col="city" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
              <th>Phone</th>
              <th>Budget</th>
              <th>Priority</th>
              <th>Assigned</th>
              <th>
                <button className="th-sort" onClick={() => toggleSort('status')}>
                  Status <SortIcon col="status" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
              <th>
                <button className="th-sort" onClick={() => toggleSort('date')}>
                  Date <SortIcon col="date" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="table-empty">
                <div className="loading-state">Loading leads...</div>
              </td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={10} className="table-empty">
                <div className="empty-state">No leads found</div>
              </td></tr>
            ) : sorted.map((lead, idx) => (
              <tr key={lead._id} onClick={() => onSelectLead(lead)} className="table-row">
                <td className="text-muted text-sm" style={{ textAlign: 'center', fontWeight: 500 }}>
                  {sorted.length - idx}
                </td>
                <td>
                  <span className="lead-name">{lead.name}</span>
                </td>
                <td className="text-muted text-sm">{lead.businessType || '—'}</td>
                <td className="text-sm">
                  {lead.city
                    ? <span className="city-cell"><MapPin size={11} />{lead.city}</span>
                    : <span className="text-placeholder">—</span>}
                </td>
                <td className="text-sm text-muted">
                  <span className="phone-cell"><Phone size={11} />{lead.phone}</span>
                </td>
                <td className="font-medium text-sm">
                  {lead.price ? `$${lead.price.toLocaleString()}` : <span className="text-placeholder">—</span>}
                </td>
                <td>
                  {lead.priority && (
                    <span className="priority-pill"
                      style={{ color: PRIORITY_COLOR[lead.priority] }}>
                      {lead.priority === 'High' ? '🔴' : lead.priority === 'Medium' ? '🟡' : '⚪'} {lead.priority}
                    </span>
                  )}
                </td>
                <td>
                  <span className="assigned-pill">👤 {getAssignedName(lead.assignedTo)}</span>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  {canEdit(lead) ? (
                    <select value={lead.status} onChange={e => handleStatusChange(e, lead)}
                      className="status-select"
                      style={{ color: STATUS_COLOR[lead.status], borderColor: `${STATUS_COLOR[lead.status]}50` }}>
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_ICON[s]} {s}</option>)}
                    </select>
                  ) : (
                    <span className="status-pill"
                      style={{ background: `${STATUS_COLOR[lead.status]}12`, color: STATUS_COLOR[lead.status], borderColor: `${STATUS_COLOR[lead.status]}30` }}>
                      {STATUS_ICON[lead.status]} {lead.status}
                    </span>
                  )}
                </td>
                <td className="text-muted text-sm date-cell">{fmt(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}