import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeads, type Lead } from '../../../features/crm/api/leadsApi';
import './Dashboard.css';

const STATUS_CLASS: Record<string, string> = {
  'New': 'new',
  'In Progress': 'in-progress',
  'Closed': 'closed',
  'Lost': 'lost',
};

const STATS_COLOR_CLASS: Record<string, string> = {
  '#2563eb': 'stat-blue',
  '#d97706': 'stat-orange',
  '#16a34a': 'stat-green',
  '#7c3aed': 'stat-purple',
};

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeads()
      .then(setLeads)
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = leads
    .filter(l => l.status === 'Closed')
    .reduce((sum, l) => sum + (l.price || 0), 0);

  const STATS = [
    { label: 'New Leads', value: leads.filter(l => l.status === 'New').length, sub: 'awaiting action', color: '#2563eb' },
    { label: 'In Progress', value: leads.filter(l => l.status === 'In Progress').length, sub: 'active deals', color: '#d97706' },
    { label: 'Closed', value: leads.filter(l => l.status === 'Closed').length, sub: 'completed projects', color: '#16a34a' },
    { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: 'from closed deals', color: '#7c3aed' },
  ];

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

  if (loading) return <div className="dashboard"><p className="dashboard-loading">Loading...</p></div>;
  if (error) return <div className="dashboard"><p className="dashboard-error">{error}</p></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Welcome back. Here's your team's overview.</p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        {STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-value ${STATS_COLOR_CLASS[s.color] || ''}`}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent leads */}
      <div className="recent-leads">
        <div className="recent-leads-header">
          <h3>Recent Leads</h3>
          <Link to="/admin/leads" className="recent-leads-link">View all →</Link>
        </div>
        
        <table className="leads-table">
          <thead>
            <tr>
              {['Client', 'Source', 'Status', 'Date'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.slice(0, 5).length === 0 ? (
              <tr><td colSpan={4} className="leads-table-empty">No leads yet</td></tr>
            ) : (
              leads.slice(0, 5).map((lead, i) => (
                <tr key={lead._id}>
                  <td className="font-medium">{lead.name}</td>
                  <td className="text-muted">
                    {lead.source ? (
                      (() => {
                        try {
                          new URL(lead.source);
                          return <a href={lead.source} target="_blank" rel="noreferrer" className="leads-table-link">🔗 Link</a>;
                        } catch {
                          return lead.source;
                        }
                      })()
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`status-badge ${STATUS_CLASS[lead.status] || ''}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="text-muted">{fmt(lead.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}