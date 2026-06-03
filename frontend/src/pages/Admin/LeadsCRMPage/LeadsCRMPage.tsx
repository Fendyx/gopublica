import { useState, useEffect } from 'react';
import { Plus, Users, TrendingUp, CheckCircle, PhoneCall } from 'lucide-react';
import {
  fetchLeads, createLead,
  type Lead, type LeadStatus, STATUS_COLOR,
} from '@/features/crm/api/leadsApi';
import LeadForm  from '@/features/crm/components/LeadForm/LeadForm';
import LeadCard  from '@/features/crm/components/LeadCard/LeadCard';
import LeadBoard from '@/features/crm/components/LeadBoard/LeadBoard';
import './LeadsCRMPage.css';

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