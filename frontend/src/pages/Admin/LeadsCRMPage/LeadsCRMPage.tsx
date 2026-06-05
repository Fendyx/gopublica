import { useState, useEffect } from 'react';
import { Plus, Users, TrendingUp, CheckCircle, PhoneCall, Phone } from 'lucide-react';
import {
  fetchLeads, createLead,
  type Lead, type LeadStatus, STATUS_COLOR,
} from '@/features/crm/api/leadsApi';
import LeadForm  from '@/features/crm/components/LeadForm/LeadForm';
import LeadCard  from '@/features/crm/components/LeadCard/LeadCard';
import LeadBoard from '@/features/crm/components/LeadBoard/LeadBoard';
import './LeadsCRMPage.css';

function UpcomingCallsPanel({ leads, onSelectLead }: { leads: Lead[]; onSelectLead: (l: Lead) => void }) {
  const now = new Date();
  const upcoming = leads
    .filter(l => l.followUpAt)
    .map(l => ({ ...l, _followUpDate: new Date(l.followUpAt!) }))
    .sort((a, b) => a._followUpDate.getTime() - b._followUpDate.getTime());

  const overdue = upcoming.filter(l => l._followUpDate < now);
  const today   = upcoming.filter(l => {
    const d = l._followUpDate;
    return d >= now && d.toDateString() === now.toDateString();
  });
  const later   = upcoming.filter(l => {
    const d = l._followUpDate;
    return d >= now && d.toDateString() !== now.toDateString();
  });

  if (upcoming.length === 0) return null;

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const Section = ({ title, items, color }: { title: string; items: typeof upcoming; color: string }) =>
    items.length === 0 ? null : (
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
        {items.map(l => (
          <div
            key={l._id}
            onClick={() => onSelectLead(l)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
              background: 'var(--bg-card)', marginBottom: 4,
              borderLeft: `3px solid ${color}`,
              fontSize: 13,
            }}
          >
            <Phone size={12} style={{ color, flexShrink: 0 }} />
            <span style={{ fontWeight: 600, flex: 1 }}>{l.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{l.phone}</span>
            <span style={{ color, fontWeight: 600, fontSize: 12, marginLeft: 'auto' }}>{fmt(l._followUpDate)}</span>
          </div>
        ))}
      </div>
    );

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 16px', marginBottom: 20,
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        📞 Scheduled Calls
        <span style={{ fontSize: 12, background: '#2563eb20', color: '#2563eb', borderRadius: 99, padding: '1px 8px', fontWeight: 600 }}>
          {upcoming.length}
        </span>
      </div>
      <Section title="⚠️ Overdue" items={overdue} color="#dc2626" />
      <Section title="🔔 Today"   items={today}   color="#d97706" />
      <Section title="📅 Upcoming" items={later}  color="#16a34a" />
    </div>
  );
}

export default function LeadsCRMPage() {
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [filter, setFilter]             = useState<LeadStatus | 'All'>('All');
  const [showForm, setShowForm]         = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads()
      .then(setLeads)
      .catch(() => setError('Failed to load leads'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data: Omit<Lead, '_id' | 'createdAt' | 'createdBy'>) => {
    const saved = await createLead(data);
    setLeads(prev => [saved, ...prev]);
    setShowForm(false);
  };

  const handleUpdated = (updated: Lead) => {
    setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
    setSelectedLead(updated);
  };

  const handleDeleted = (id: string) => {
    setLeads(prev => prev.filter(l => l._id !== id));
    setSelectedLead(null);
  };

  // ── Quick stats ──────────────────────────────────────────────────────────
  const stats = {
    total:      leads.length,
    active:     leads.filter(l => l.status === 'In Progress').length,
    closed:     leads.filter(l => l.status === 'Closed').length,
    callBacks:  leads.filter(l => l.status === 'Call Back').length,
  };

  return (
    <div className="leads-crm">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="crm-header">
        <div>
          <h1 className="page-title">Leads CRM</h1>
          <p className="page-subtitle">Manage and track your leads pipeline</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Lead'}
        </button>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#2563eb15', color: '#2563eb' }}>
            <Users size={18} />
          </div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Leads</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d9770615', color: '#d97706' }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#16a34a15', color: '#16a34a' }}>
            <CheckCircle size={18} />
          </div>
          <div>
            <div className="stat-value">{stats.closed}</div>
            <div className="stat-label">Closed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b15', color: '#f59e0b' }}>
            <PhoneCall size={18} />
          </div>
          <div>
            <div className="stat-value">{stats.callBacks}</div>
            <div className="stat-label">Call Backs</div>
          </div>
        </div>
      </div>

      <UpcomingCallsPanel leads={leads} onSelectLead={setSelectedLead} />

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button className="btn btn-icon btn-ghost" onClick={() => setError('')} aria-label="Close">×</button>
        </div>
      )}

      {/* ── Add lead form ──────────────────────────────────────────────────── */}
      {showForm && (
        <div className="form-wrap">
          <LeadForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* ── Board ─────────────────────────────────────────────────────────── */}
      <LeadBoard
        leads={leads}
        loading={loading}
        filter={filter}
        onFilterChange={setFilter}
        onSelectLead={setSelectedLead}
        onLeadUpdated={handleUpdated}
      />

      {/* ── Lead detail modal ──────────────────────────────────────────────── */}
      {selectedLead && (
        <LeadCard
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}