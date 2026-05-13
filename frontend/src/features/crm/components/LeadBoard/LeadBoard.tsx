import { Link2, Phone, DollarSign, User, Calendar, ChevronDown } from 'lucide-react';
import {
  type Lead, type LeadStatus,
  STATUS_COLOR, PRIORITY_COLOR, STATUSES, updateLead, getAssignedName,
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

export default function LeadBoard({ leads, loading, filter, onFilterChange, onSelectLead, onLeadUpdated }: Props) {
  const { user } = useAuthStore();
  const filtered = filter === 'All' ? leads : leads.filter(l => l.status === filter);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, lead: Lead) => {
    e.stopPropagation();
    try { const updated = await updateLead(lead._id!, { status: e.target.value as LeadStatus }); onLeadUpdated(updated); }
    catch (err: any) { alert(err.message); }
  };

  const canEdit = (lead: Lead) => {
    if (user?.role === 'superadmin') return true;
    const assignedId = typeof lead.assignedTo === 'object' ? lead.assignedTo?._id : lead.assignedTo;
    return assignedId === user?.id;
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <span className="text-muted text-sm">Filter:</span>
        {(['All', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => onFilterChange(s)}
            className={`badge ${filter === s ? 'badge-primary' : 'badge-outline'}`}>
            {s} <span className="badge-count">{s === 'All' ? leads.length : leads.filter(l => l.status === s).length}</span>
          </button>
        ))}
      </div>

      <div className="card card-table">
        <table className="table">
          <thead>
            <tr>
              {['Client', 'Business', 'Phone', 'Source', 'Budget', 'Priority', 'Assigned', 'Status', 'Date'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="table-empty">Loading leads...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="table-empty">No leads found</td></tr>
            ) : (
              filtered.map((lead, i) => (
                <tr key={lead._id} onClick={() => onSelectLead(lead)} className="table-row">
                  <td className="font-medium">{lead.name}</td>
                  <td className="text-muted">{lead.businessType || '—'}</td>
                  <td className="text-muted flex gap-1"><Phone size={12} /> {lead.phone}</td>
                  <td className="text-truncate">
                    {lead.source ? (
                      isURL(lead.source)
                        ? <a href={lead.source} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="link">🔗 Link</a>
                        : <span className="text-muted">{lead.source}</span>
                    ) : <span className="text-placeholder">—</span>}
                  </td>
                  <td className="font-medium">{lead.price ? `$${lead.price}` : '—'}</td>
                  <td>
                    {lead.priority && (
                      <span className="badge badge-outline" style={{ color: PRIORITY_COLOR[lead.priority], borderColor: `${PRIORITY_COLOR[lead.priority]}30` }}>
                        {lead.priority}
                      </span>
                    )}
                  </td>
                  <td className="text-sm">
                    <span className="badge badge-ghost">👤 {getAssignedName(lead.assignedTo)}</span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {canEdit(lead) ? (
                      <select value={lead.status} onChange={e => handleStatusChange(e, lead)}
                        className="select-status" style={{ borderColor: `${STATUS_COLOR[lead.status]}50`, color: STATUS_COLOR[lead.status] }}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className="badge" style={{ background: `${STATUS_COLOR[lead.status]}12`, color: STATUS_COLOR[lead.status] }}>
                        {lead.status}
                      </span>
                    )}
                  </td>
                  <td className="text-muted text-sm">{fmt(lead.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

const isURL = (str?: string) => { try { return str ? Boolean(new URL(str)) : false; } catch { return false; }; };