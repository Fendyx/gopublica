import { useState, useEffect } from 'react';
import { X, Plus, User, Phone, Link, DollarSign, Building2, Flag, MapPin, Clock } from 'lucide-react';
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
  city: '',
  businessHours: '',
  followUpAt: '',
});

interface Props {
  onSave: (data: Omit<Lead, '_id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Omit<Lead, '_id' | 'createdAt' | 'createdBy'>;
  isEdit?: boolean;
}

export default function LeadForm({ onSave, onCancel, initialData, isEdit = false }: Props) {
  const { user } = useAuthStore();
  const [form, setForm] = useState(initialData ?? EMPTY(user?.id || ''));
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [customService, setCustomService] = useState('');

  useEffect(() => {
    fetchAdmins().then(setAdmins).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

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
        <h3 className="lead-form-title">{isEdit ? '✏️ Edit Lead' : '➕ New Lead'}</h3>
        <button className="btn btn-icon btn-ghost" onClick={onCancel} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {/* Row 1: Name + Phone */}
      <div className="form-section">
        <div className="form-section-title">Contact Info</div>
        <div className="grid-2">
          <div className="form-group">
            <label className="label"><User size={12} /> Name / Company *</label>
            <input className="input" type="text" value={form.name}
              onChange={e => set('name', e.target.value)} placeholder="e.g. Mario's Pizzeria" />
          </div>
          <div className="form-group">
            <label className="label"><Phone size={12} /> Phone *</label>
            <input className="input" type="text" value={form.phone}
              onChange={e => set('phone', e.target.value)} placeholder="+48 123 456 789" />
          </div>
        </div>
      </div>

      {/* Row 2: City + Business Hours */}
      <div className="form-section">
        <div className="form-section-title">Location & Hours</div>
        <div className="grid-2">
          <div className="form-group">
            <label className="label"><MapPin size={12} /> City</label>
            <input className="input" type="text" value={form.city ?? ''}
              onChange={e => set('city', e.target.value)} placeholder="e.g. Warsaw, Kraków" />
          </div>
          <div className="form-group">
            <label className="label"><Clock size={12} /> Business Hours</label>
            <input className="input" type="text" value={form.businessHours ?? ''}
              onChange={e => set('businessHours', e.target.value)}
              placeholder="e.g. Mon–Fri 09:00–22:00" />
          </div>
        </div>
      </div>

      <div className="form-section">
  <div className="form-section-title">📞 Schedule Call</div>
  <div className="form-group">
    <label className="label"><Phone size={12} /> Call Back At</label>
    <input
      className="input"
      type="datetime-local"
      value={form.followUpAt ? new Date(form.followUpAt).toISOString().slice(0, 16) : ''}
      onChange={e => set('followUpAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
    />
    {form.followUpAt && (
      <button
        type="button"
        className="btn btn-sm btn-ghost"
        style={{ marginTop: 4, fontSize: 12 }}
        onClick={() => set('followUpAt', null)}
      >
        × Clear
      </button>
    )}
  </div>
</div>

      {/* Row 3: Source + Budget */}
      <div className="form-section">
        <div className="form-section-title">Deal Info</div>
        <div className="grid-2">
          <div className="form-group">
            <label className="label"><Link size={12} /> Source</label>
            <input className="input" type="text" value={form.source}
              onChange={e => set('source', e.target.value)} placeholder="URL or note" />
          </div>
          <div className="form-group">
            <label className="label"><DollarSign size={12} /> Budget ($)</label>
            <input className="input" type="number" min={0} value={form.price}
              onChange={e => set('price', Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Row 4: Business Type + Priority + Assigned */}
      <div className="form-section">
        <div className="grid-3">
          <div className="form-group">
            <label className="label"><Building2 size={12} /> Business Type</label>
            <select className="select" value={form.businessType} onChange={e => set('businessType', e.target.value)}>
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label"><Flag size={12} /> Priority</label>
            <select className="select" value={form.priority} onChange={e => set('priority', e.target.value as LeadPriority)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label"><User size={12} /> Assigned To</label>
            <select
              className="select"
              value={typeof form.assignedTo === 'string' ? form.assignedTo : (form.assignedTo as any)?._id || ''}
              onChange={e => set('assignedTo', e.target.value)}
              disabled={user?.role !== 'superadmin'}
            >
              {admins.length === 0 && <option value={user?.id || ''}>{user?.name || 'Me'}</option>}
              {admins.map(a => (
                <option key={a._id} value={a._id}>
                  {a.name} {a._id === user?.id ? '(me)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="form-section">
        <div className="form-section-title">Services Requested</div>
        <div className="services-grid">
          {PRESET_SERVICES.map(service => {
            const selected = form.servicesRequested?.includes(service);
            return (
              <button key={service} type="button" onClick={() => toggleService(service)}
                className={`service-tag ${selected ? 'service-tag-active' : ''}`}>
                {service}
              </button>
            );
          })}
        </div>
        {/* Custom services */}
        {form.servicesRequested?.filter(s => !PRESET_SERVICES.includes(s)).map(s => (
          <span key={s} className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 6, marginTop: 6 }}>
            {s}
            <button type="button" onClick={() => toggleService(s)} className="badge-close">×</button>
          </span>
        ))}
        <div className="custom-service-row">
          <input className="input" type="text" value={customService}
            onChange={e => setCustomService(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomService()}
            placeholder="Custom service... (press Enter)" />
          <button type="button" className="btn btn-sm btn-ghost" onClick={addCustomService}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="form-section">
        <div className="form-group">
          <label className="label">Notes</label>
          <textarea className="textarea" value={form.comment}
            onChange={e => set('comment', e.target.value)}
            placeholder="Additional notes about this lead..." />
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSubmit}
          disabled={saving || !form.name.trim() || !form.phone.trim()}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Lead'}
        </button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}