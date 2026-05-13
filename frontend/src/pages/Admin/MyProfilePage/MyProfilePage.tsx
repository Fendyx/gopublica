import { useState, useEffect } from 'react';
import { fetchMyStats } from '../../../features/crm/api/leadsApi';
import { useAuthStore } from '../../../store/store';
import { Link } from 'react-router-dom';
import { STATUS_COLOR, type Lead } from '../../../features/crm/api/leadsApi';

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

const cardStyle = {
  background: 'white', border: '1px solid #e5e7eb',
  borderRadius: '12px', padding: '24px', marginBottom: '20px',
};

export default function MyProfilePage() {
  const { user } = useAuthStore();
  const [stats, setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    fetchMyStats()
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', color: '#9ca3af' }}>Loading...</div>;
  if (error)   return <div style={{ padding: '40px', color: '#dc2626' }}>{error}</div>;

  const { leads, clients, leadStats, earnings } = stats;

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Аватар */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '24px', fontWeight: 700, flexShrink: 0,
        }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '22px' }}>{user?.name}</h2>
          <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '14px' }}>{user?.email}</p>
          <span style={{
            fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
            background: user?.role === 'superadmin' ? '#fef3c7' : '#eff6ff',
            color:      user?.role === 'superadmin' ? '#92400e'  : '#1d4ed8',
          }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Earnings */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 20px 0' }}>💰 My Earnings</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {/* Сделки */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '20px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Closed Deals
            </p>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#15803d' }}>
              ${earnings.dealsEarnings.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              Your {earnings.dealsCut * 100}% · Total: ${earnings.dealsRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {leadStats.closed} closed deal{leadStats.closed !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Подписки */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '20px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Subscriptions / month
            </p>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1d4ed8' }}>
              €{earnings.subsEarnings.toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              Your {earnings.subsCut * 100}% · Total: €{earnings.subsMonthly.toLocaleString()}/mo
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {clients.length} active client{clients.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Итого */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1e2f, #1e40af)',
          borderRadius: '10px', padding: '20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Earnings
            </p>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>
              ~${earnings.total.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
            <div>Deals: ${earnings.dealsEarnings}</div>
            <div>Subs: €{earnings.subsEarnings}/mo</div>
          </div>
        </div>
      </div>

      {/* Lead stats */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 20px 0' }}>📊 My Lead Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Total',       value: leadStats.total,      color: '#374151' },
            { label: 'New',         value: leadStats.new,        color: '#2563eb' },
            { label: 'In Progress', value: leadStats.inProgress, color: '#d97706' },
            { label: 'Closed',      value: leadStats.closed,     color: '#16a34a' },
          ].map(s => (
            <div key={s.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* My leads table */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 20px 0' }}>📋 My Leads</h3>
        {leads.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No leads assigned to you yet.</p>
        ) : (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Client', 'Budget', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: Lead, i: number) => (
                  <tr key={lead._id}
                    style={{ borderBottom: i < leads.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{lead.name}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{lead.price ? `$${lead.price}` : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: STATUS_COLOR[lead.status] + '18',
                        color: STATUS_COLOR[lead.status],
                      }}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>{fmt(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My clients */}
      {clients.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0' }}>🤝 My Active Clients</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {clients.map((client: any) => (
              <div key={client._id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px',
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{client.name}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{client.businessType} · {client.country}</div>
                </div>
                <Link to={`/admin/clients/${client._id}`}
                  style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}