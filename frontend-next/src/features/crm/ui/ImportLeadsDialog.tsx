'use client';

import { useState, useEffect } from 'react';
import { importLeads, fetchAdmins } from '@/entities/lead/api/leadsApi';
import { BUSINESS_TYPES, type AdminUser } from '@/entities/lead/model/types';
import { useAuthStore } from '@/store/authStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportLeadsDialog({ open, onClose }: Props) {
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>(user?.id || '');
  const [businessType, setBusinessType] = useState<string>('Other');
  const [customBusinessType, setCustomBusinessType] = useState('');

  useEffect(() => { if (open) fetchAdmins().then(setAdmins).catch(console.error); }, [open]);
  useEffect(() => { if (user?.id && !assignedTo) setAssignedTo(user.id); }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) setPreview(data.slice(0, 10));
        else setError('JSON must be an array');
      } catch { setError('Invalid JSON file'); }
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const leads = JSON.parse(text);
      const finalBusinessType = businessType === 'Other' && customBusinessType.trim() ? customBusinessType.trim() : businessType;
      const res = await importLeads(leads, assignedTo || null, finalBusinessType);
      setResult(res);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Import Leads from JSON</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg)] rounded">✕</button>
        </div>

        <input type="file" accept=".json" onChange={handleFileChange} className="w-full border-2 border-dashed rounded-lg p-3 text-sm mb-4" />

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-semibold">Assigned To</label>
            <select className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
              <option value="">— Unassigned —</option>
              {admins.map(a => <option key={a._id} value={a._id}>{a.name} {a._id === user?.id ? '(me)' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold">Business Type</label>
            <select className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" value={businessType} onChange={e => { setBusinessType(e.target.value); if (e.target.value !== 'Other') setCustomBusinessType(''); }}>
              {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {businessType === 'Other' && <input className="w-full mt-2 border rounded-lg px-3 py-2 text-sm" value={customBusinessType} onChange={e => setCustomBusinessType(e.target.value)} placeholder="Specify business type..." />}
          </div>
        </div>

        {error && <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

        {preview && (
          <div className="mb-4">
            <h3 className="font-semibold text-sm mb-2">Preview (first 10)</h3>
            <table className="w-full text-xs border">
              <thead><tr><th className="p-1 border">Title</th><th className="p-1 border">Phone</th><th className="p-1 border">Category</th></tr></thead>
              <tbody>{preview.map((item, idx) => <tr key={idx}><td className="p-1 border">{item.title}</td><td className="p-1 border">{item.phone}</td><td className="p-1 border">{item.categoryName}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {result && <div className="p-3 mb-4 rounded-lg bg-green-50 text-green-700 text-sm">Inserted: {result.inserted}, Skipped: {result.skipped}</div>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
          <button onClick={handleImport} disabled={!file || loading} className="px-4 py-2 rounded-lg bg-[var(--primary-color)] text-white disabled:opacity-50">
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}