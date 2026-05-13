import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { fetchLeads, createLead, type Lead, type LeadStatus } from '@/features/crm/api/leadsApi';
import LeadForm  from '@/features/crm/components/LeadForm/LeadForm';
import LeadCard  from '@/features/crm/components/LeadCard/LeadCard';
import LeadBoard from '@/features/crm/components/LeadBoard/LeadBoard';
import './LeadsCRMPage.css';

export default function LeadsCRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<LeadStatus | 'All'>('All');
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads().then(setLeads).catch(() => setError('Failed to load leads')).finally(() => setLoading(false));
  }, []);

  const handleSave = async (data: Omit<Lead, '_id' | 'createdAt'>) => {
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

  return (
    <div className="leads-crm">
      <div className="leads-crm-header flex flex-between">
        <div>
          <h1 className="page-title">Leads CRM</h1>
          <p className="page-subtitle">{leads.length} total leads</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Lead'}
        </button>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button className="btn btn-icon btn-ghost" onClick={() => setError('')} aria-label="Close">×</button>
        </div>
      )}

      {showForm && <div className="mb-6"><LeadForm onSave={handleSave} onCancel={() => setShowForm(false)} /></div>}
      <LeadBoard leads={leads} loading={loading} filter={filter} onFilterChange={setFilter} onSelectLead={setSelectedLead} onLeadUpdated={handleUpdated} />
      {selectedLead && <LeadCard lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdated={handleUpdated} onDeleted={handleDeleted} />}
    </div>
  );
}