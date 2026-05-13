import { useState } from 'react';
import { X, Plus, Image, Link, Tag, DollarSign } from 'lucide-react';
import type { PortfolioCase } from '@/entities/case/types';

const EMPTY: Omit<PortfolioCase, '_id' | 'createdAt'> = {
  title: '', slug: '', niche: 'cafe',
  heroImages: [], liveUrl: '', shortDescription: '',
  challenge: '', solution: '', targetAudience: '',
  metrics: [], features: [], gallery: [], techStack: [],
  development: {}, pricing: { showPrice: true, currency: 'USD', range: {} },
  isPublished: false, sortOrder: 0,
};

interface Props {
  initial?: PortfolioCase;
  onSave: (data: Omit<PortfolioCase, '_id' | 'createdAt'> | Partial<PortfolioCase>) => Promise<void>;
  onCancel: () => void;
}

export default function PortfolioCaseForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  const push = <K extends keyof typeof form>(key: K, item: any) => setForm(prev => ({ ...prev, [key]: [...(prev[key] as any[] || []), item] }));
  const remove = <K extends keyof typeof form>(key: K, index: number) => setForm(prev => ({ ...prev, [key]: (prev[key] as any[]).filter((_, i) => i !== index) }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.liveUrl.trim()) return;
    setSaving(true);
    try { await onSave(initial ? form : (form as Omit<PortfolioCase, '_id' | 'createdAt'>)); }
    finally { setSaving(false); }
  };

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3>{initial ? 'Edit Case' : 'New Case'}</h3>
        <button className="btn btn-icon btn-ghost" onClick={onCancel}><X size={18} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label className="label">Title *</label>
          <input className="input" value={form.title} onChange={e => { set('title', e.target.value); if (!initial) set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')); }} />
        </div>
        <div>
          <label className="label">Slug *</label>
          <input className="input" value={form.slug} onChange={e => set('slug', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label className="label"><Tag size={12} /> Niche</label>
          <select className="select" value={form.niche} onChange={e => set('niche', e.target.value)}>
            {['cafe','restaurant','barbershop','fitness','retail','services','other'].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="label"><Link size={12} /> Live URL *</label>
          <input className="input" value={form.liveUrl} onChange={e => set('liveUrl', e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label className="label">Short Description</label>
        <textarea className="textarea" value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)} maxLength={200} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label className="label">Challenge *</label>
          <textarea className="textarea" value={form.challenge} onChange={e => set('challenge', e.target.value)} />
        </div>
        <div>
          <label className="label">Solution *</label>
          <textarea className="textarea" value={form.solution} onChange={e => set('solution', e.target.value)} />
        </div>
      </div>

      {/* Metrics */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label">Business Metrics</label>
        {form.metrics.map((m, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
            <input className="input" placeholder="Label" value={m.label} onChange={e => { const arr = [...form.metrics]; arr[i].label = e.target.value; set('metrics', arr); }} />
            <input className="input" placeholder="Value" value={m.value} onChange={e => { const arr = [...form.metrics]; arr[i].value = e.target.value; set('metrics', arr); }} />
            <input className="input" placeholder="Description" value={m.description || ''} onChange={e => { const arr = [...form.metrics]; arr[i].description = e.target.value; set('metrics', arr); }} />
            <button className="btn btn-sm btn-danger" onClick={() => remove('metrics', i)}>×</button>
          </div>
        ))}
        <button className="btn btn-sm btn-ghost" onClick={() => push('metrics', { label: '', value: '' })}><Plus size={14} /> Add Metric</button>
      </div>

      {/* Features */}
      <div style={{ marginBottom: '16px' }}>
        <label className="label">Features → Benefits</label>
        {form.features.map((f, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
            <input className="input" placeholder="Feature" value={f.feature} onChange={e => { const arr = [...form.features]; arr[i].feature = e.target.value; set('features', arr); }} />
            <input className="input" placeholder="Benefit" value={f.benefit} onChange={e => { const arr = [...form.features]; arr[i].benefit = e.target.value; set('features', arr); }} />
            <button className="btn btn-sm btn-danger" onClick={() => remove('features', i)}>×</button>
          </div>
        ))}
        <button className="btn btn-sm btn-ghost" onClick={() => push('features', { feature: '', benefit: '' })}><Plus size={14} /> Add Feature</button>
      </div>

      {/* Pricing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <label className="label"><DollarSign size={12} /> Price Range</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input className="input" type="number" placeholder="Min" value={form.pricing.range?.min || ''} onChange={e => set('pricing', { ...form.pricing, range: { ...form.pricing.range, min: +e.target.value } })} />
          <input className="input" type="number" placeholder="Max" value={form.pricing.range?.max || ''} onChange={e => set('pricing', { ...form.pricing, range: { ...form.pricing.range, max: +e.target.value } })} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isPublished} onChange={e => set('isPublished', e.target.checked)} />
          <span>Published</span>
        </label>
        <input className="input" type="number" placeholder="Sort Order" value={form.sortOrder} onChange={e => set('sortOrder', +e.target.value)} style={{ width: '120px' }} />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Case'}</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}