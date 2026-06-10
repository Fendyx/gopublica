'use client';

import { useState } from 'react';
import {
  X, Phone, DollarSign, Building2, Calendar,
  Link2, Tag, MessageSquare, Trash2, Pencil, MapPin, Clock,
} from 'lucide-react';
import { updateLead, deleteLead } from '@/entities/lead/api/leadsApi';
import {
  type Lead, type LeadStatus,
  STATUS_COLOR, STATUS_ICON, PRIORITY_COLOR, STATUSES, getAssignedName,
} from '@/entities/lead/model/types';
import LeadForm from './LeadForm';
import { useAuthStore } from '@/store/authStore';

interface Props {
  lead: Lead;
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
  onDeleted: (id: string) => void;
}

const isURL = (str?: string) => { try { return str ? Boolean(new URL(str)) : false; } catch { return false; } };
const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

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

export default function LeadCard({ lead, onClose, onUpdated, onDeleted }: Props) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [schedulingCall, setSchedulingCall] = useState(false);
  const [callDateTime, setCallDateTime] = useState('');

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

  const handleEditSave = async (data: Omit<Lead, '_id' | 'createdAt' | 'createdBy'>) => {
    const updated = await updateLead(lead._id!, data);
    onUpdated(updated);
    setIsEditing(false);
  };

  const handleScheduleCall = async () => {
    const iso = callDateTime ? new Date(callDateTime).toISOString() : null;
    const updated = await updateLead(lead._id!, { followUpAt: iso ?? undefined });
    onUpdated(updated);
    setSchedulingCall(false);
    setCallDateTime('');
  };

  const editInitialData: Omit<Lead, '_id' | 'createdAt' | 'createdBy'> = {
    name: lead.name, phone: lead.phone, source: lead.source, comment: lead.comment,
    status: lead.status, price: lead.price, businessType: lead.businessType,
    servicesRequested: lead.servicesRequested, priority: lead.priority,
    followUpAt: lead.followUpAt, assignedTo: lead.assignedTo,
    city: lead.city, businessHours: lead.businessHours,
  };

  const statusColor = STATUS_COLOR[lead.status];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {isEditing ? (
          <div className="p-6">
            <LeadForm isEdit initialData={editInitialData} onSave={handleEditSave} onCancel={() => setIsEditing(false)} />
          </div>
        ) : (
          <>
            <div className="p-5 border-b" style={{ borderTop: `3px solid ${statusColor}` }}>
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">{lead.name}</h2>
                <div className="flex gap-1">
                  {canEdit() && <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-lg hover:bg-[var(--bg)]"><Pencil size={15} /></button>}
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg)]"><X size={18} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border" style={{ backgroundColor: `${statusColor}15`, color: statusColor, borderColor: `${statusColor}30` }}>{STATUS_ICON[lead.status]} {lead.status}</span>
                {lead.priority && <span className="text-xs font-semibold" style={{ color: PRIORITY_COLOR[lead.priority] }}>{lead.priority === 'High' ? '🔴' : lead.priority === 'Medium' ? '🟡' : '⚪'} {lead.priority}</span>}
                {lead.assignedTo && <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] bg-[var(--bg)] px-2 py-0.5 rounded-full border">👤 {getAssignedName(lead.assignedTo)}</span>}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--bg)] rounded-lg border">
                <div><span className="text-xs font-semibold uppercase text-[var(--text-muted)]"><Phone size={11} className="inline mr-1"/>Phone</span><p className="text-sm font-medium">{lead.phone}</p></div>
                <div><span className="text-xs font-semibold uppercase text-[var(--text-muted)]"><DollarSign size={11} className="inline mr-1"/>Budget</span><p className="text-sm font-medium">{lead.price ? `$${lead.price.toLocaleString()}` : '—'}</p></div>
                <div><span className="text-xs font-semibold uppercase text-[var(--text-muted)]"><Building2 size={11} className="inline mr-1"/>Business</span><p className="text-sm">{lead.businessType || '—'}</p></div>
                <div><span className="text-xs font-semibold uppercase text-[var(--text-muted)]"><Calendar size={11} className="inline mr-1"/>Added</span><p className="text-sm">{fmt(lead.createdAt)}</p></div>
                {lead.city && <div><span className="text-xs font-semibold uppercase text-[var(--text-muted)]"><MapPin size={11} className="inline mr-1"/>City</span><p className="text-sm">{lead.city}</p></div>}
                {lead.businessHours && <div><span className="text-xs font-semibold uppercase text-[var(--text-muted)]"><Clock size={11} className="inline mr-1"/>Hours</span><p className="text-sm">{lead.businessHours}</p></div>}
                {lead.followUpAt && (() => { const { label, color } = getFollowUpLabel(lead.followUpAt); return <div className="col-span-2"><span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Scheduled Call</span><p className="text-sm font-semibold" style={{ color }}>{label}</p></div>; })()}
              </div>

              {lead.source && (
                <div className="p-3 bg-[var(--bg)] rounded-lg border">
                  <span className="text-xs font-semibold uppercase text-[var(--text-muted)]"><Link2 size={11} className="inline mr-1"/>Source</span>
                  {isURL(lead.source) ? <a href={lead.source} target="_blank" rel="noreferrer" className="block text-sm text-[var(--primary-color)] hover:underline">🔗 {lead.source}</a> : <p className="text-sm">{lead.source}</p>}
                </div>
              )}

              {lead.servicesRequested?.length ? (
                <div>
                  <span className="text-xs font-semibold uppercase text-[var(--text-muted)]"><Tag size={11} className="inline mr-1"/>Services</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {lead.servicesRequested.map(s => <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-color)]/10 text-[var(--primary-color)] border border-[var(--primary-color)]/20">{s}</span>)}
                  </div>
                </div>
              ) : null}

              <div className="p-3 bg-[var(--bg)] rounded-lg border">
                <span className="text-xs font-semibold uppercase text-[var(--text-muted)]"><MessageSquare size={11} className="inline mr-1"/>Notes</span>
                <p className="text-sm mt-1">{lead.comment || 'No notes yet.'}</p>
              </div>

              {canEdit() && (
                <div>
                  <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Schedule Call</span>
                  {!schedulingCall ? (
                    <button onClick={() => { setSchedulingCall(true); setCallDateTime(lead.followUpAt ? new Date(lead.followUpAt).toISOString().slice(0,16) : ''); }} className="block text-sm text-[var(--primary-color)] hover:underline mt-1">
                      {lead.followUpAt ? '✏️ Change scheduled call' : '+ Set call reminder'}
                    </button>
                  ) : (
                    <div className="flex gap-2 mt-1 items-center">
                      <input type="datetime-local" className="border rounded px-2 py-1 text-sm flex-1" value={callDateTime} onChange={e => setCallDateTime(e.target.value)} />
                      <button onClick={handleScheduleCall} className="px-3 py-1 text-sm rounded bg-[var(--primary-color)] text-white">Save</button>
                      {lead.followUpAt && <button onClick={async () => { const updated = await updateLead(lead._id!, { followUpAt: undefined }); onUpdated(updated); setSchedulingCall(false); }} className="px-3 py-1 text-sm rounded border">Clear</button>}
                      <button onClick={() => setSchedulingCall(false)} className="px-3 py-1 text-sm rounded border">Cancel</button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">Change Status</span>
                {canEdit() ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => handleStatusChange(s)} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${lead.status === s ? 'shadow-sm' : ''}`}
                        style={{ backgroundColor: lead.status === s ? `${STATUS_COLOR[s]}20` : 'transparent', color: STATUS_COLOR[s], borderColor: STATUS_COLOR[s] }}>
                        {STATUS_ICON[s]} {s}
                      </button>
                    ))}
                  </div>
                ) : <p className="text-xs text-[var(--text-muted)] mt-1">Only assigned admin can change status.</p>}
              </div>
            </div>

            {canEdit() && (
              <div className="p-4 border-t flex justify-end">
                <button onClick={handleDelete} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-red-600 border border-red-200 hover:bg-red-50">
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