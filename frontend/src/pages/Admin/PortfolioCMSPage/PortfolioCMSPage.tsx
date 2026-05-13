import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { portfolioApi } from '@/features/portfolio/api/portfolioApi';
import type { PortfolioCase } from '@/entities/case/types';
// ↓ Исправлена опечатка: componnets → components
import PortfolioCaseForm from '@/features/portfolio/componnets/PortfolioCaseForm';
import './PortfolioCMSPage.css';

export default function PortfolioCMSPage() {
  const [cases, setCases] = useState<PortfolioCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // ← состояние ошибки
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PortfolioCase | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await portfolioApi.getAllAdmin();
      
      // Гарантия, что данные — массив
      if (Array.isArray(data)) {
        setCases(data);
      } else {
        console.error('Unexpected API response:', data);
        setCases([]);
        setError('Invalid data format from server');
      }
    } catch (err: any) {
      console.error('Failed to load portfolio cases:', err);
      setError(err.message || 'Failed to load cases');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (data: any) => {
    try {
      if (editing) {
        await portfolioApi.update(editing._id, data);
      } else {
        await portfolioApi.create(data);
      }
      setShowForm(false);
      setEditing(null);
      load(); // перезагружаем список
    } catch (err: any) {
      console.error('Save error:', err);
      alert(err.message || 'Failed to save case');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this case?')) return;
    try {
      await portfolioApi.delete(id);
      load();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete case');
    }
  };

  // Состояние загрузки
  if (loading) {
    return (
      <div className="portfolio-cms" style={{ padding: '24px' }}>
        <p>Loading cases...</p>
      </div>
    );
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className="portfolio-cms" style={{ padding: '24px' }}>
        <div style={{ 
          padding: '16px', 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '8px', 
          color: '#991b1b',
          marginBottom: '16px'
        }}>
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-ghost" 
            onClick={load} 
            style={{ marginLeft: '12px', color: '#991b1b' }}
          >
            Retry
          </button>
        </div>
        <details>
          <summary style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Debug info</summary>
          <pre style={{ fontSize: '0.8rem', overflow: 'auto', background: '#f3f4f6', padding: '12px', borderRadius: '4px' }}>
            {JSON.stringify({ cases, error }, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="portfolio-cms">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Portfolio CMS</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{cases.length} cases</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} /> Add Case
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '24px' }}>
          <PortfolioCaseForm 
            initial={editing || undefined} 
            onSave={handleSave} 
            onCancel={() => { setShowForm(false); setEditing(null); }} 
          />
        </div>
      )}

      <div className="card card-table">
        <table className="table">
          <thead>
            <tr>
              <th>Case</th>
              <th>Niche</th>
              <th>Slug</th>
              <th>Published</th>
              <th>Sort</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                  No cases found. Click "Add Case" to create one.
                </td>
              </tr>
            ) : (
              cases.map(c => (
                <tr key={c._id}>
                  <td>
                    <strong>{c.title}</strong>
                    <br/>
                    <small className="text-muted" style={{ wordBreak: 'break-all' }}>{c.liveUrl}</small>
                  </td>
                  <td><span className="badge badge-outline">{c.niche}</span></td>
                  <td><code style={{ background: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>{c.slug}</code></td>
                  <td>{c.isPublished ? '✅' : '❌'}</td>
                  <td>{c.sortOrder}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <a 
                      href={`/case/${c.slug}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-sm btn-ghost" 
                      title="View"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button 
                      className="btn btn-sm btn-ghost" 
                      onClick={() => { setEditing(c); setShowForm(true); }} 
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn btn-sm btn-danger" 
                      onClick={() => handleDelete(c._id)} 
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}