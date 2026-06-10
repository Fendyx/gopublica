'use client';

import { useState, useEffect } from 'react';
import { X, Plus, User, Phone, Link, DollarSign, Building2, Flag, MapPin, Clock } from 'lucide-react';
import { fetchAdmins } from '@/entities/lead/api/leadsApi';
import {
  BUSINESS_TYPES, PRESET_SERVICES, PRIORITIES,
  type Lead, type LeadPriority, type AdminUser,
} from '@/entities/lead/model/types';
import { useAuthStore } from '@/store/authStore';

const EMPTY = (currentUserId: string): Omit<Lead, '_id' | 'createdAt' | 'createdBy'> => ({
  name: '', phone: '', source: '', comment: '',
  status: 'New', price: 0,
  businessType: 'Other', servicesRequested: [],
  assignedTo: currentUserId,
  priority: 'Medium',
  city: '', businessHours: '', followUpAt: '',
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

  useEffect(() => { fetchAdmins().then(setAdmins).catch(console.error); }, []);
  useEffect(() => { if (initialData) setForm(initialData); }, [initialData]);

  const set = (key: keyof ReturnType<typeof EMPTY>, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleService = (service: string) => {
    const list = form.servicesRequested ?? [];
    set('servicesRequested', list.includes(service) ? list.filter(s => s !== service) : [...list, service]);
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
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="border rounded-xl p-6 bg-[var(--surface)] space-y-5">
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="text-lg font-bold">{isEdit ? '✏️ Edit Lead' : '➕ New Lead'}</h3>
        <button onClick={onCancel} className="p-1 hover:bg-[var(--bg)] rounded"><X size={18} /></button>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-bold uppercase text-[var(--text-muted)]">Contact Info</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-semibold"><User size={12} className="inline mr-1"/>Name *</label><input className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mario's Pizzeria" /></div>
          <div><label className="text-xs font-semibold"><Phone size={12} className="inline mr-1"/>Phone *</label><input className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+48 123 456 789" /></div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-bold uppercase text-[var(--text-muted)]">Location & Hours</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-semibold"><MapPin size={12} className="inline mr-1"/>City</label><input className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.city ?? ''} onChange={e => set('city', e.target.value)} placeholder="Warsaw" /></div>
          <div><label className="text-xs font-semibold"><Clock size={12} className="inline mr-1"/>Business Hours</label><input className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.businessHours ?? ''} onChange={e => set('businessHours', e.target.value)} placeholder="Mon-Fri 09:00-22:00" /></div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-bold uppercase text-[var(--text-muted)]">Deal Info</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-semibold"><Link size={12} className="inline mr-1"/>Source</label><input className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.source} onChange={e => set('source', e.target.value)} placeholder="URL or note" /></div>
          <div><label className="text-xs font-semibold"><DollarSign size={12} className="inline mr-1"/>Budget ($)</label><input type="number" className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.price} onChange={e => set('price', Number(e.target.value))} /></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs font-semibold"><Building2 size={12} className="inline mr-1"/>Business Type</label><select className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.businessType} onChange={e => set('businessType', e.target.value)}>{BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        <div><label className="text-xs font-semibold"><Flag size={12} className="inline mr-1"/>Priority</label><select className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={form.priority} onChange={e => set('priority', e.target.value as LeadPriority)}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
        <div><label className="text-xs font-semibold"><User size={12} className="inline mr-1"/>Assigned To</label>
          <select className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={typeof form.assignedTo === 'string' ? form.assignedTo : (form.assignedTo as any)?._id || ''} onChange={e => set('assignedTo', e.target.value)} disabled={user?.role !== 'superadmin'}>
            {admins.length === 0 && <option value={user?.id || ''}>{user?.name || 'Me'}</option>}
            {admins.map(a => <option key={a._id} value={a._id}>{a.name} {a._id === user?.id ? '(me)' : ''}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-bold uppercase text-[var(--text-muted)]">Services Requested</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SERVICES.map(service => {
            const selected = form.servicesRequested?.includes(service);
            return <button key={service} type="button" onClick={() => toggleService(service)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selected ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary-color)]'}`}>{service}</button>;
          })}
        </div>
        {form.servicesRequested?.filter(s => !PRESET_SERVICES.includes(s)).map(s => (
          <span key={s} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">
            {s} <button type="button" onClick={() => toggleService(s)} className="ml-1 hover:text-red-500">×</button>
          </span>
        ))}
        <div className="flex gap-2 mt-1">
          <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm" value={customService} onChange={e => setCustomService(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomService()} placeholder="Custom service..." />
          <button type="button" onClick={addCustomService} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-[var(--bg)]"><Plus size={14} /> Add</button>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold">Notes</label>
        <textarea className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" rows={3} value={form.comment} onChange={e => set('comment', e.target.value)} placeholder="Additional notes..." />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={handleSubmit} disabled={saving || !form.name.trim() || !form.phone.trim()} className="px-5 py-2 rounded-lg bg-[var(--primary-color)] text-white font-semibold disabled:opacity-50">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Lead'}
        </button>
        <button onClick={onCancel} className="px-5 py-2 rounded-lg border hover:bg-[var(--bg)]">Cancel</button>
      </div>
    </div>
  );
}