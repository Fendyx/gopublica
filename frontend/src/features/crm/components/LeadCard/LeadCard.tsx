import { X, Phone, DollarSign, Building2, Calendar, Link2, Tag, MessageSquare, Trash2 } from 'lucide-react';
import {
  type Lead, type LeadStatus,
  STATUS_COLOR, PRIORITY_COLOR, STATUSES, updateLead, deleteLead,
  getAssignedName,
} from '../../api/leadsApi';
import ConvertLeadButton from '../ConvertLeadButton/ConvertLeadButton';
import { useAuthStore } from '../../../../store/store';
import './LeadCard.css';

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
  onDeleted: (id: string) => void;
}

const isURL = (str?: string) => { try { return str ? Boolean(new URL(str)) : false; } catch { return false; }; };
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

export default function LeadCard({ lead, onClose, onUpdated, onDeleted }: Props) {
  const { user } = useAuthStore();

  const canEdit = () => {
    if (user?.role === 'superadmin') return true;
    const assignedId = typeof lead.assignedTo === 'object' ? lead.assignedTo?._id : lead.assignedTo;
    return assignedId === user?.id;
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${lead.name}"?`)) return;
    try { await deleteLead(lead._id!); onDeleted(lead._id!); }
    catch (err: any) { alert(err.message); }
  };

  const handleStatusChange = async (status: LeadStatus) => {
    try { const updated = await updateLead(lead._id!, { status }); onUpdated(updated); }
    catch (err: any) { alert(err.message); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header flex flex-between">
          <div>
            <h2 className="modal-title">{lead.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="badge" style={{ background: `${STATUS_COLOR[lead.status]}15`, color: STATUS_COLOR[lead.status] }}>
                {lead.status}
              </span>
              {lead.priority && (
                <span className="badge badge-outline" style={{ color: PRIORITY_COLOR[lead.priority], borderColor: `${PRIORITY_COLOR[lead.priority]}40` }}>
                  {lead.priority}
                </span>
              )}
              {lead.assignedTo && (
                <span className="text-muted text-sm">👤 {getAssignedName(lead.assignedTo)}</span>
              )}
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="grid-2 mb-4">
            {[
              { icon: Phone, label: 'Phone', value: lead.phone },
              { icon: DollarSign, label: 'Budget', value: lead.price ? `$${lead.price.toLocaleString()}` : '—' },
              { icon: Building2, label: 'Business', value: lead.businessType || '—' },
              { icon: Calendar, label: 'Added', value: fmt(lead.createdAt) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <p className="label flex gap-1"><Icon size={10} /> {label}</p>
                <p className="text-medium">{value}</p>
              </div>
            ))}
          </div>

          {lead.source && (
            <div className="card mb-4">
              <p className="label flex gap-1"><Link2 size={10} /> Source</p>
              {isURL(lead.source)
                ? <a href={lead.source} target="_blank" rel="noreferrer" className="link-truncate">🔗 {lead.source}</a>
                : <p className="text-medium">{lead.source}</p>
              }
            </div>
          )}

          {lead.servicesRequested?.length ? (
            <div className="mb-4">
              <p className="label flex gap-1"><Tag size={10} /> Services</p>
              <div className="flex flex-wrap gap-2">
                {lead.servicesRequested?.map(s => (
                  <span key={s} className="badge badge-outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>{s}</span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="card mb-4">
            <p className="label flex gap-1"><MessageSquare size={10} /> Notes</p>
            <p className="text-medium">{lead.comment || 'No notes yet.'}</p>
          </div>

          <div className="mb-4">
            <p className="label">Change Status</p>
            {canEdit() ? (
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className={`badge ${lead.status === s ? 'badge-primary' : 'badge-outline'}`}
                    style={lead.status !== s ? { color: STATUS_COLOR[s], borderColor: `${STATUS_COLOR[s]}40` } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">Only assigned admin can change status.</p>
            )}
          </div>

          {lead.status !== 'Closed' && canEdit() && (
            <ConvertLeadButton leadId={lead._id!} leadName={lead.name} onConverted={onClose} />
          )}
        </div>

        {canEdit() && (
          <div className="modal-footer">
            <button className="btn btn-sm btn-danger" onClick={handleDelete}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
