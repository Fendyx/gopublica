import React, { useState, useEffect } from 'react';
import { importLeads, fetchAdmins, type AdminUser } from '../../api/leadsApi';
import { useAuthStore } from '../../../../store/store';
import './ImportLeadsDialog.css';

interface ImportResult {
  inserted: number;
  skipped: number;
  skippedDetails?: { title: string; reason: string }[];
}

const ImportLeadsDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>(user?.id || '');

  useEffect(() => {
    fetchAdmins().then(setAdmins).catch(console.error);
  }, []);

  // Установим по умолчанию текущего пользователя, если есть
  useEffect(() => {
    if (user?.id && !assignedTo) setAssignedTo(user.id);
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          setPreview(data.slice(0, 10));
        } else {
          setError('JSON must be an array');
        }
      } catch {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const leads = JSON.parse(text);
      const res = await importLeads(leads, assignedTo || null);
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Import Leads from Apify JSON</h2>
        <input type="file" accept=".json" onChange={handleFileChange} />

        {/* Выбор Assigned To */}
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="label">Assigned To</label>
          <select
            className="select"
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
          >
            <option value="">— Unassigned —</option>
            {admins.map(a => (
              <option key={a._id} value={a._id}>
                {a.name} {a._id === user?.id ? '(me)' : ''}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error">{error}</div>}
        {preview && (
          <div className="preview">
            <h3>Preview (first 10)</h3>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Phone</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.title}</td>
                    <td>{item.phone}</td>
                    <td>{item.categoryName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {result && (
          <div className="result">
            <p>Inserted: {result.inserted}</p>
            <p>Skipped (duplicates): {result.skipped}</p>
          </div>
        )}
        <div className="actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleImport} disabled={!file || loading}>
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportLeadsDialog;