'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Upload } from 'lucide-react';
import LeadBoard from '@/features/crm/ui/LeadBoard';
import LeadCard from '@/features/crm/ui/LeadCard';
import LeadForm from '@/features/crm/ui/LeadForm';
import ImportLeadsDialog from '@/features/crm/ui/ImportLeadsDialog';
import { fetchLeads, createLead } from '@/entities/lead/api/leadsApi';
import { type Lead, type LeadStatus } from '@/entities/lead/model/types';
import { useAuthStore } from '@/store/authStore';

export default function LeadsCRMPage() {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeadStatus | 'All'>('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const loadLeads = useCallback(async () => {
    try { setLoading(true); const data = await fetchLeads(); setLeads(data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleLeadUpdated = (updated: Lead) => {
    setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
    setSelectedLead(updated);
  };

  const handleLeadDeleted = (id: string) => {
    setLeads(prev => prev.filter(l => l._id !== id));
    setSelectedLead(null);
  };

  const handleCreateLead = async (data: Omit<Lead, '_id' | 'createdAt' | 'createdBy'>) => {
    const newLead = await createLead(data);
    setLeads(prev => [newLead, ...prev]);
    setShowNewForm(false);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads CRM</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowNewForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary-color)] text-white font-semibold">
            <Plus size={18} /> Add Lead
          </button>
          <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-[var(--bg)]">
            <Upload size={18} /> Import
          </button>
        </div>
      </div>

      <LeadBoard
        leads={leads}
        loading={loading}
        filter={filter}
        onFilterChange={setFilter}
        onSelectLead={setSelectedLead}
        onLeadUpdated={handleLeadUpdated}
      />

      {selectedLead && (
        <LeadCard
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={handleLeadUpdated}
          onDeleted={handleLeadDeleted}
        />
      )}

      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewForm(false)}>
          <div className="w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <LeadForm
              onSave={handleCreateLead}
              onCancel={() => setShowNewForm(false)}
            />
          </div>
        </div>
      )}

      <ImportLeadsDialog open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}