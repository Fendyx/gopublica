import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchClients, type Client } from '../../../features/clients/api/clientsApi';

const STATUS_COLOR = {
  active:  '#16a34a',
  paused:  '#d97706',
  churned: '#dc2626',
};

const PLAN_COLOR = {
  Basic:    '#6b7280',
  Standard: '#2563eb',
  Premium:  '#7c3aed',
};

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState<'all' | 'active' | 'paused'>('all');

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? clients : clients.filter(c => c.status === filter);

  // Считаем MRR (Monthly Recurring Revenue)
  const mrr = clients
    .filter(c => c.status === 'active' && c.subscription?.status === 'active')
    .reduce((sum, c) => sum + (c.subscription?.amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px 0' }}>Clients</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          {clients.filter(c => c.status === 'active').length} active clients · MRR: €{mrr}
        </p>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['all', 'active', 'paused'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '5px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
              background: filter === f ? 'black' : 'white',
              color: filter === f ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              fontWeight: filter === f ? 600 : 400,
              textTransform: 'capitalize',
            }}>
            {f === 'all' ? `All (${clients.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${clients.filter(c => c.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Client', 'Country', 'Website', 'Plan', 'Monthly Fee', 'Next Billing', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading clients...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                No clients yet. Convert a lead to get started.
              </td></tr>
            ) : (
              filtered.map((client, i) => (
                <tr key={client._id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{client.name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{client.businessType}</div>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#6b7280', fontSize: '13px' }}>
                    {client.country || '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {client.websiteUrl ? (
                      <a href={client.websiteUrl} target="_blank" rel="noreferrer"
                        style={{ color: '#2563eb', fontSize: '13px' }}>
                        🔗 Visit
                      </a>
                    ) : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {client.subscription ? (
                      <span style={{
                        fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                        background: (PLAN_COLOR[client.subscription.plan] || '#6b7280') + '15',
                        color: PLAN_COLOR[client.subscription.plan] || '#6b7280',
                      }}>
                        {client.subscription.plan}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: 600, color: '#111827' }}>
                    {client.subscription ? `€${client.subscription.amount}` : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#6b7280' }}>
                    {client.subscription ? fmt(client.subscription.nextBillingDate) : '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                      background: STATUS_COLOR[client.status] + '15',
                      color: STATUS_COLOR[client.status],
                    }}>
                      {client.status}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <Link to={`/admin/clients/${client._id}`}
                      style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                      View →
                    </Link>
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