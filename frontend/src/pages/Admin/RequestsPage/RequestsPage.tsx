import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchChangeRequests, updateChangeRequest, deleteChangeRequest,
  type ChangeRequest,
} from '../../../features/clients/api/clientsApi';

const CR_STATUS_COLOR: Record<string, string> = {
  new:         '#2563eb',
  approved:    '#7c3aed',
  in_progress: '#d97706',
  done:        '#16a34a',
  rejected:    '#dc2626',
};

const CR_STATUSES = ['new', 'approved', 'in_progress', 'done', 'rejected'] as const;
const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

export default function RequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState<string>('all');

  useEffect(() => {
    fetchChangeRequests()
      .then(setRequests)
      .catch(() => setError('Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const handleStatusChange = async (id: string, status: ChangeRequest['status']) => {
    try {
      const updated = await updateChangeRequest(id, { status });
      setRequests(prev => prev.map(r => r._id === id ? updated : r));
    } catch { setError('Failed to update'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await deleteChangeRequest(id);
      setRequests(prev => prev.filter(r => r._id !== id));
    } catch { setError('Failed to delete'); }
  };

  const getClientName = (cr: ChangeRequest) => {
    if (typeof cr.clientId === 'object') return cr.clientId.name;
    return '—';
  };

  const getClientId = (cr: ChangeRequest) => {
    if (typeof cr.clientId === 'object') return cr.clientId._id;
    return cr.clientId as string;
  };

  // Stats
  const inProgress = requests.filter(r => r.status === 'in_progress').length;
  const newCount   = requests.filter(r => r.status === 'new').length;
  const billable   = requests.filter(r => r.billable && r.status !== 'rejected').reduce((s, r) => s + r.price, 0);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px 0' }}>Change Requests</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          {newCount} new · {inProgress} in progress · €{billable} billable
        </p>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(['all', ...CR_STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '5px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
              background: filter === s ? 'black' : 'white',
              color: filter === s ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              fontWeight: filter === s ? 600 : 400,
            }}>
            {s === 'all' ? `All (${requests.length})` : `${s.replace('_', ' ')} (${requests.filter(r => r.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Request', 'Client', 'Priority', 'Price', 'Status', 'Created', ''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>No requests found</td></tr>
            ) : (
              filtered.map((cr, i) => (
                <tr key={cr._id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '13px 16px', maxWidth: '240px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{cr.title}</div>
                    {cr.description && (
                      <div style={{ fontSize: '12px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cr.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <Link to={`/admin/clients/${getClientId(cr)}`}
                      style={{ color: '#2563eb', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
                      {getClientName(cr)}
                    </Link>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                      background: cr.priority === 'High' ? '#fee2e2' : cr.priority === 'Medium' ? '#fef3c7' : '#f3f4f6',
                      color: cr.priority === 'High' ? '#dc2626' : cr.priority === 'Medium' ? '#92400e' : '#6b7280',
                    }}>
                      {cr.priority}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 600 }}>
                    {cr.billable && cr.price > 0
                      ? <span style={{ color: '#d97706' }}>€{cr.price}</span>
                      : <span style={{ color: '#16a34a', fontSize: '12px' }}>included</span>
                    }
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <select
                      value={cr.status}
                      onChange={e => handleStatusChange(cr._id, e.target.value as any)}
                      style={{
                        border: `1px solid ${CR_STATUS_COLOR[cr.status]}40`,
                        background: CR_STATUS_COLOR[cr.status] + '12',
                        color: CR_STATUS_COLOR[cr.status],
                        borderRadius: '6px', padding: '4px 8px',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {CR_STATUSES.map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#9ca3af', fontSize: '12px' }}>{fmt(cr.createdAt)}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={() => handleDelete(cr._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px' }}>
                      🗑
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