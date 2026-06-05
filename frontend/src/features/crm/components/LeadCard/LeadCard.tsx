import { useState } from 'react';
import {
  X, Phone, DollarSign, Building2, Calendar,
  Link2, Tag, MessageSquare, Trash2, Pencil, MapPin, Clock,
} from 'lucide-react';
import {
  type Lead, type LeadStatus,
  STATUS_COLOR, STATUS_ICON, PRIORITY_COLOR, STATUSES, updateLead, deleteLead,
  getAssignedName,
} from '../../api/leadsApi';
import ConvertLeadButton from '../ConvertLeadButton/ConvertLeadButton';
import LeadForm from '../LeadForm/LeadForm';
import { useAuthStore } from '../../../../store/store';
import './LeadCard.css';

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
  onDeleted: (id: string) => void;
}

const isURL = (str?: string) => {
  try { return str ? Boolean(new URL(str)) : false; }
  catch { return false; }
};
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

export default function LeadCard({ lead, onClose, onUpdated, onDeleted }: Props) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

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
    try {
      const updated = await updateLead(lead._id!, { status });
      onUpdated(updated);
    }
    catch (err: any) { alert(err.message); }
  };

  const handleEditSave = async (data: Omit<Lead, '_id' | 'createdAt' | 'createdBy'>) => {
    const updated = await updateLead(lead._id!, data);
    onUpdated(updated);
    setIsEditing(false);
  };

  const editInitialData: Omit<Lead, '_id' | 'createdAt' | 'createdBy'> = {
    name:              lead.name,
    phone:             lead.phone,
    source:            lead.source,
    comment:           lead.comment,
    status:            lead.status,
    price:             lead.price,
    businessType:      lead.businessType,
    servicesRequested: lead.servicesRequested,
    priority:          lead.priority,
    followUpAt:        lead.followUpAt,
    assignedTo:        lead.assignedTo,
    city:              lead.city,
    businessHours:     lead.businessHours,
  };

  const statusColor = STATUS_COLOR[lead.status];

  const getFollowUpLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = diffMs / 1000 / 3600;

  if (diffMs < 0) return { label: `⚠️ Overdue · ${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, color: '#dc2626' };
  if (diffH < 24) return { label: `🔔 Today at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, color: '#d97706' };
  if (diffH < 48) return { label: `📅 Tomorrow at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, color: '#2563eb' };
  return { label: `📅 ${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, color: '#16a34a' };
};

const [schedulingCall, setSchedulingCall] = useState(false);
const [callDateTime, setCallDateTime]     = useState('');

const handleScheduleCall = async () => {
  const iso = callDateTime ? new Date(callDateTime).toISOString() : null;
  const updated = await updateLead(lead._id!, { followUpAt: iso ?? undefined });
  onUpdated(updated);
  setSchedulingCall(false);
  setCallDateTime('');
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {isEditing ? (
          <div className="modal-body">
            <LeadForm
              isEdit
              initialData={editInitialData}
              onSave={handleEditSave}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="modal-header" style={{ borderTop: `3px solid ${statusColor}` }}>
              <div className="modal-header-content">
                <div className="modal-title-row">
                  <h2 className="modal-title">{lead.name}</h2>
                  <div className="modal-actions">
                    {canEdit() && (
                      <button className="btn btn-icon btn-ghost" onClick={() => setIsEditing(true)} aria-label="Edit">
                        <Pencil size={15} />
                      </button>
                    )}
                    <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="modal-badges">
                  <span className="status-badge" style={{ background: `${statusColor}15`, color: statusColor, borderColor: `${statusColor}30` }}>
                    {STATUS_ICON[lead.status]} {lead.status}
                  </span>
                  {lead.priority && (
                    <span className="priority-badge" style={{ color: PRIORITY_COLOR[lead.priority] }}>
                      {lead.priority === 'High' ? '🔴' : lead.priority === 'Medium' ? '🟡' : '⚪'} {lead.priority}
                    </span>
                  )}
                  {lead.assignedTo && (
                    <span className="assigned-badge">👤 {getAssignedName(lead.assignedTo)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div className="modal-body">

              {/* Info grid */}
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label"><Phone size={11} /> Phone</span>
                  <span className="info-value">{lead.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-label"><DollarSign size={11} /> Budget</span>
                  <span className="info-value">{lead.price ? `$${lead.price.toLocaleString()}` : '—'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label"><Building2 size={11} /> Business</span>
                  <span className="info-value">{lead.businessType || '—'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label"><Calendar size={11} /> Added</span>
                  <span className="info-value">{fmt(lead.createdAt)}</span>
                </div>
                {lead.city && (
                  <div className="info-item">
                    <span className="info-label"><MapPin size={11} /> City</span>
                    <span className="info-value">{lead.city}</span>
                  </div>
                )}
                {lead.businessHours && (
                  <div className="info-item">
                    <span className="info-label"><Clock size={11} /> Hours</span>
                    <span className="info-value">{lead.businessHours}</span>
                  </div>
                )}
                {lead.followUpAt && (() => {
                  const { label, color } = getFollowUpLabel(lead.followUpAt);
                  return (
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="info-label">Scheduled Call</span>
                      <span className="info-value" style={{ color, fontWeight: 600 }}>{label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Source */}
              {lead.source && (
                <div className="detail-card">
                  <p className="detail-card-label"><Link2 size={11} /> Source</p>
                  {isURL(lead.source)
                    ? <a href={lead.source} target="_blank" rel="noreferrer" className="source-link">🔗 {lead.source}</a>
                    : <p className="info-value">{lead.source}</p>
                  }
                </div>
              )}

              {/* Services */}
              {lead.servicesRequested?.length ? (
                <div className="detail-section">
                  <p className="detail-card-label"><Tag size={11} /> Services</p>
                  <div className="tags-row">
                    {lead.servicesRequested.map(s => (
                      <span key={s} className="tag tag-primary">{s}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Notes */}
              <div className="detail-card">
                <p className="detail-card-label"><MessageSquare size={11} /> Notes</p>
                <p className="notes-text">{lead.comment || 'No notes yet.'}</p>
              </div>

              {canEdit() && (
                <div className="detail-section">
                  <p className="detail-card-label">📞 Schedule Call</p>
                  {!schedulingCall ? (
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => {
                        setSchedulingCall(true);
                        setCallDateTime(
                          lead.followUpAt
                            ? new Date(lead.followUpAt).toISOString().slice(0, 16)
                            : ''
                        );
                      }}
                    >
                      {lead.followUpAt ? '✏️ Change scheduled call' : '+ Set call reminder'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="datetime-local"
                        className="input"
                        style={{ flex: 1, minWidth: 200 }}
                        value={callDateTime}
                        onChange={e => setCallDateTime(e.target.value)}
                      />
                      <button className="btn btn-sm btn-primary" onClick={handleScheduleCall}>Save</button>
                      {lead.followUpAt && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={async () => {
                            const updated = await updateLead(lead._id!, { followUpAt: undefined });
                            onUpdated(updated);
                            setSchedulingCall(false);
                          }}
                        >
                          Clear
                        </button>
                      )}
                      <button className="btn btn-sm btn-ghost" onClick={() => setSchedulingCall(false)}>Cancel</button>
                    </div>
                  )}
                </div>
              )}

              {/* Status change */}
              <div className="detail-section">
                <p className="detail-card-label">Change Status</p>
                {canEdit() ? (
                  <div className="status-buttons">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => handleStatusChange(s)}
                        className={`status-btn ${lead.status === s ? 'status-btn-active' : ''}`}
                        style={{
                          '--status-color': STATUS_COLOR[s],
                          background: lead.status === s ? `${STATUS_COLOR[s]}20` : 'transparent',
                          color: STATUS_COLOR[s],
                          borderColor: lead.status === s ? STATUS_COLOR[s] : `${STATUS_COLOR[s]}30`,
                        } as React.CSSProperties}>
                        {STATUS_ICON[s]} {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted" style={{ fontSize: 13 }}>Only assigned admin can change status.</p>
                )}
              </div>

              {/* Convert button */}
              {lead.status !== 'Closed' && canEdit() && (
                <div style={{ marginTop: 8 }}>
                  <ConvertLeadButton leadId={lead._id!} leadName={lead.name} onConverted={onClose} />
                </div>
              )}
            </div>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            {canEdit() && (
              <div className="modal-footer">
                <button className="btn btn-sm btn-danger" onClick={handleDelete}>
                  <Trash2 size={13} /> Delete Lead
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}