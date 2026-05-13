import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Globe, Mail, DollarSign, Package } from 'lucide-react';
import { convertLead, type ConvertLeadPayload } from '../../../clients/api/clientsApi';
import './ConvertLeadButton.css';

interface Props {
  leadId: string;
  leadName: string;
  onConverted?: () => void;
}

const PLANS = ['Basic', 'Standard', 'Premium'] as const;
const COUNTRIES = ['PL', 'ES', 'DE', 'UA', 'Other'];

export default function ConvertLeadButton({ leadId, leadName, onConverted }: Props) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ConvertLeadPayload>({
    email: '', country: 'PL', websiteUrl: '', plan: 'Basic', amount: 29,
  });

  const handleConvert = async () => {
    setLoading(true); setError('');
    try {
      const { client } = await convertLead(leadId, form);
      onConverted?.();
      navigate(`/admin/clients/${client._id}`);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (!showForm) {
    return (
      <button className="btn btn-success" onClick={() => setShowForm(true)}>
        <Check size={14} /> Convert to Client
      </button>
    );
  }

  return (
    <div className="convert-form card">
      <h4 className="convert-title">Convert "{leadName}"</h4>
      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2 mb-4">
        <div>
          <label className="label flex gap-1"><Mail size={10} /> Email</label>
          <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@business.com" />
        </div>
        <div>
          <label className="label flex gap-1"><Globe size={10} /> Country</label>
          <select className="select" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label flex gap-1"><Globe size={10} /> Website</label>
          <input className="input" type="text" value={form.websiteUrl} onChange={e => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <label className="label flex gap-1"><Package size={10} /> Plan</label>
          <select className="select" value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value as any })}>
            {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label flex gap-1"><DollarSign size={10} /> Monthly Fee (€)</label>
          <input className="input" type="number" min={0} value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn btn-success" onClick={handleConvert} disabled={loading}>
          {loading ? 'Converting...' : '✓ Confirm'}
        </button>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={14} /> Cancel</button>
      </div>
    </div>
  );
}