'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2, UserRoundPlus } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { archiveClient, createClient, fetchClients, updateClient, type Client, type ClientFormData, type ClientStatus } from '@/entities/client/api/clientsApi';

const roleOptions: Array<'client_admin' | 'client_manager'> = ['client_admin', 'client_manager'];
const subscriptionStatusOptions = ['none', 'trialing', 'active', 'past_due', 'canceled', 'incomplete'];
const subscriptionPlanOptions = ['none', 'basic', 'pro'];

const emptyForm: ClientFormData = {
  email: '',
  password: '',
  name: '',
  phone: '',
  companyName: '',
  vatId: '',
  role: 'client_admin',
  isActive: true,
  tenantId: '',
  subscriptionStatus: 'none',
  subscriptionPlan: 'none',
};

export default function ClientsAdminPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchClients();
      setClients(data);
      if (data.length) setSelectedId(data[0]._id ?? null);
    } catch (err) {
      console.error(err);
      setError('Unable to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadClients(); }, [loadClients]);

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter((client) => {
      const haystack = `${client.name} ${client.phone} ${client.email} ${client.companyName} ${client.tenantId || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [clients, search]);

  const selectedClient = useMemo(() => {
    if (isCreating || !selectedId) return null;
    return filteredClients.find((client) => client._id === selectedId) ?? null;
  }, [filteredClients, selectedId, isCreating]);

  const openNew = () => {
    setForm(emptyForm);
    setSelectedId(null);
    setIsCreating(true);
    setError(null);
  };

  const handleSelect = (client: Client) => {
    setSelectedId(client._id ?? null);
    setIsCreating(false);
    setForm({
      email: client.email || '',
      password: '',
      name: client.name || '',
      phone: client.phone || '',
      companyName: client.companyName || '',
      vatId: client.vatId || '',
      role: client.role || 'client_admin',
      isActive: client.isActive,
      tenantId: client.tenantId || '',
      subscriptionStatus: client.subscriptionStatus || 'none',
      subscriptionPlan: client.subscriptionPlan || 'none',
    });
    setError(null);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      setError('Name and phone are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (isCreating || !selectedClient?._id) {
        const created = await createClient(form);
        setClients(prev => [created, ...prev]);
        setSelectedId(created._id ?? null);
        setIsCreating(false);
      } else {
        const updated = await updateClient(selectedClient._id, form);
        setClients(prev => prev.map(client => client._id === updated._id ? updated : client));
        setSelectedId(updated._id ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedClient?._id) return;
    try {
      await archiveClient(selectedClient._id);
      setClients(prev => prev.filter(client => client._id !== selectedClient._id));
      setSelectedId(null);
      setIsCreating(false);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to archive client');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Clients</h2>
          <p className="text-sm text-[var(--text-muted)]">Manage client contacts, assignments and status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNew}>
            <UserRoundPlus className="mr-2 h-4 w-4" /> New Client
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Plus className="mr-2 h-4 w-4" /> {isCreating || !selectedClient ? 'Create client' : 'Save changes'}
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
            <Search className="h-4 w-4 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email, assignee"
              className="w-full bg-transparent outline-none"
            />
          </div>

          {loading ? (
            <div className="text-sm text-[var(--text-muted)]">Loading clients…</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)]">No clients found.</div>
          ) : (
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <button
                  key={client._id}
                  className={`w-full rounded-xl border p-3 text-left transition ${selectedClient?._id === client._id ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10' : 'border-[var(--border)] hover:bg-[var(--bg)]'}`}
                  onClick={() => handleSelect(client)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{client.name}</div>
                      <div className="text-sm text-[var(--text-muted)]">{client.phone} • {client.email || 'No email'}</div>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-xs ${client.isActive ? 'border-emerald-500/30 text-emerald-600' : 'border-red-500/30 text-red-600'}`}>
                      {client.isActive ? 'active' : 'inactive'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{isCreating || !selectedClient ? 'New client' : 'Client details'}</h3>
              <p className="text-sm text-[var(--text-muted)]">Edit the main fields and keep the record up to date.</p>
            </div>
            {selectedClient && (
              <Button variant="outline" size="sm" onClick={handleArchive}>
                <Trash2 className="mr-2 h-4 w-4" /> Archive
              </Button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Phone</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Email</span>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
            </label>
            {!selectedClient && (
              <label className="text-sm">
                <span className="mb-1 block font-medium">Password</span>
                <input type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
              </label>
            )}
            <label className="text-sm">
              <span className="mb-1 block font-medium">Company name</span>
              <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">VAT ID</span>
              <input value={form.vatId} onChange={(e) => setForm({ ...form, vatId: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Role</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'client_admin' | 'client_manager' })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Tenant ID</span>
              <input value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Subscription status</span>
              <select value={form.subscriptionStatus} onChange={(e) => setForm({ ...form, subscriptionStatus: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                {subscriptionStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Subscription plan</span>
              <select value={form.subscriptionPlan} onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                {subscriptionPlanOptions.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span>Active account</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
