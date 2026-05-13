import { useState, useEffect } from 'react';
import { X, Plus, User, Phone, Link, DollarSign, Building2, Flag, Calendar } from 'lucide-react';
import {
  BUSINESS_TYPES, PRESET_SERVICES, PRIORITIES,
  fetchAdmins, type Lead, type LeadPriority, type AdminUser,
} from '../../api/leadsApi';
import { useAuthStore } from '../../../../store/store';
import './LeadForm.css';

const EMPTY = (currentUserId: string): Omit<Lead, '_id' | 'createdAt' | 'createdBy'> => ({
  name: '', phone: '', source: '', comment: '',
  status: 'New', price: 0,
  businessType: 'Other', servicesRequested: [],
  assignedTo: currentUserId,
  priority: 'Medium',
});

interface Props {
  onSave: (data: Omit<Lead, '_id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  onCancel: () => void;
}

export default function LeadForm({ onSave, onCancel }: Props) {
  const { user } = useAuthStore();
  const [form, setForm] = useState(EMPTY(user?.id || ''));
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [customService, setCustomService] = useState('');

  useEffect(() => {
    fetchAdmins().then(setAdmins).catch(console.error);
  }, []);

  const set = (key: keyof ReturnType<typeof EMPTY>, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleService = (service: string) => {
    const list = form.servicesRequested ?? [];
    set('servicesRequested',
      list.includes(service) ? list.filter(s => s !== service) : [...list, service]
    );
  };

  const addCustomService = () => {
    const trimmed = customService.trim();
    if (!trimmed) return;
    const list = form.servicesRequested ?? [];
    if (!list.includes(trimmed)) set('servicesRequested', [...list, trimmed]);
    setCustomService('');
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <div className="lead-form card">
      <div className="lead-form-header flex flex-between">
        <h3 className="lead-form-title">New Lead</h3>
        <button className="btn btn-icon btn-ghost" onClick={onCancel} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="grid-2 mb-4">
        <div>
          <label className="label"><User size={12} /> Name / Company *</label>
          <input className="input" type="text" value={form.name}
            onChange={e => set('name', e.target.value)} placeholder="e.g. Mario's Pizzeria" />
        </div>
        <div>
          <label className="label"><Phone size={12} /> Phone *</label>
          <input className="input" type="text" value={form.phone}
            onChange={e => set('phone', e.target.value)} placeholder="+48 123 456 789" />
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div>
          <label className="label"><Link size={12} /> Source</label>
          <input className="input" type="text" value={form.source}
            onChange={e => set('source', e.target.value)} placeholder="URL or note" />
        </div>
        <div>
          <label className="label"><DollarSign size={12} /> Budget</label>
          <input className="input" type="number" min={0} value={form.price}
            onChange={e => set('price', Number(e.target.value))} />
        </div>
      </div>

      <div className="grid-3 mb-4">
        <div>
          <label className="label"><Building2 size={12} /> Business Type</label>
          <select className="select" value={form.businessType} onChange={e => set('businessType', e.target.value)}>
            {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label"><Flag size={12} /> Priority</label>
          <select className="select" value={form.priority} onChange={e => set('priority', e.target.value as LeadPriority)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label"><User size={12} /> Assigned To</label>
          <select className="select" value={typeof form.assignedTo === 'string' ? form.assignedTo : (form.assignedTo as any)?._id || ''}
            onChange={e => set('assignedTo', e.target.value)}>
            {admins.length === 0 && <option value={user?.id || ''}>{user?.name || 'Me'}</option>}
            {admins.map(a => <option key={a._id} value={a._id}>{a.name} {a._id === user?.id ? '(me)' : ''}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="label">Services Requested</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_SERVICES.map(service => {
            const selected = form.servicesRequested?.includes(service);
            return (
              <button key={service} type="button" onClick={() => toggleService(service)}
                className={`badge ${selected ? 'badge-primary' : 'badge-outline'}`}>
                {service}
              </button>
            );
          })}
        </div>
        {form.servicesRequested?.filter(s => !PRESET_SERVICES.includes(s)).map(s => (
          <span key={s} className="badge badge-warning">
            {s}
            <button type="button" onClick={() => toggleService(s)} className="badge-close">×</button>
          </span>
        ))}
        <div className="flex gap-2 mt-3">
          <input className="input" type="text" value={customService}
            onChange={e => setCustomService(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomService()}
            placeholder="Other service... (Enter)" />
          <button type="button" className="btn btn-sm btn-ghost" onClick={addCustomService}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="label">Notes</label>
        <textarea className="textarea" value={form.comment}
          onChange={e => set('comment', e.target.value)}
          placeholder="Additional notes..." />
      </div>

      <div className="flex gap-3">
        <button className="btn btn-primary" onClick={handleSubmit}
          disabled={saving || !form.name.trim() || !form.phone.trim()}>
          {saving ? 'Saving...' : 'Save Lead'}
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}