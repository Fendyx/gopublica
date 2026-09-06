'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2, Wrench } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import {
  adminCustomServiceApi,
  type CreateCustomServiceData,
} from '@/entities/customService/api/adminCustomServiceApi';
import type { CustomService } from '@/entities/customService/model/types';

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'cancelled'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

const emptyForm: CreateCustomServiceData = {
  tenantId: '',
  title: '',
  description: '',
  price: 0,
  currency: 'pln',
  priority: 'medium',
  notes: '',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'border-blue-500/30 text-blue-600',
  in_progress: 'border-amber-500/30 text-amber-600',
  completed: 'border-emerald-500/30 text-emerald-600',
  cancelled: 'border-gray-400/30 text-gray-500',
};

export default function CustomServicesAdminPage() {
  const [services, setServices] = useState<CustomService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CreateCustomServiceData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminCustomServiceApi.list();
      setServices(data);
      if (data.length) setSelectedId(data[0]._id);
    } catch (err) {
      console.error(err);
      setError('Unable to load custom services');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const filteredServices = useMemo(() => {
    const q = search.toLowerCase();
    return services.filter((s) => {
      const haystack = `${s.title} ${s.description} ${s.tenantId} ${s.notes || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [services, search]);

  const selectedService = useMemo(() => {
    if (isCreating || !selectedId) return null;
    return filteredServices.find((s) => s._id === selectedId) ?? null;
  }, [filteredServices, selectedId, isCreating]);

  const openNew = () => {
    setForm(emptyForm);
    setSelectedId(null);
    setIsCreating(true);
    setError(null);
  };

  const handleSelect = (service: CustomService) => {
    setSelectedId(service._id);
    setIsCreating(false);
    setForm({
      tenantId: service.tenantId,
      title: service.title,
      description: service.description || '',
      price: service.price,
      currency: service.currency,
      priority: service.priority,
      notes: service.notes || '',
    });
    setError(null);
  };

  const handleSave = async () => {
    if (!form.tenantId?.trim() || !form.title?.trim()) {
      setError('Tenant ID and title are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isCreating || !selectedService?._id) {
        const created = await adminCustomServiceApi.create(form);
        setServices((prev) => [created, ...prev]);
        setSelectedId(created._id);
        setIsCreating(false);
      } else {
        const { tenantId: _, ...patch } = form;
        const updated = await adminCustomServiceApi.update(selectedService._id, patch);
        setServices((prev) =>
          prev.map((s) => (s._id === updated._id ? updated : s))
        );
        setSelectedId(updated._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedService?._id) return;
    if (!confirm('Delete this custom service?')) return;

    try {
      await adminCustomServiceApi.delete(selectedService._id);
      setServices((prev) => prev.filter((s) => s._id !== selectedService._id));
      setSelectedId(null);
      setIsCreating(false);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete');
    }
  };

  const handleStatusChange = async (service: CustomService, newStatus: string) => {
    try {
      const updated = await adminCustomServiceApi.update(service._id, { status: newStatus });
      setServices((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Custom Services</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Manage billable tasks and custom development for tenants.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> New Service
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {isCreating || !selectedService ? 'Create service' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {/* Left: List */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
            <Search className="h-4 w-4 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, tenant ID, description…"
              className="w-full bg-transparent outline-none"
            />
          </div>

          {loading ? (
            <div className="text-sm text-[var(--text-muted)]">Loading services…</div>
          ) : filteredServices.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)]">No custom services found.</div>
          ) : (
            <div className="space-y-2">
              {filteredServices.map((service) => (
                <button
                  key={service._id}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedService?._id === service._id
                      ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10'
                      : 'border-[var(--border)] hover:bg-[var(--bg)]'
                  }`}
                  onClick={() => handleSelect(service)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{service.title}</div>
                      <div className="text-sm text-[var(--text-muted)] truncate">
                        {service.tenantId} • {service.price > 0 ? `${service.price} ${service.currency.toUpperCase()}` : 'Free'}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${STATUS_BADGE[service.status] || ''}`}
                    >
                      {service.status.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Right: Form */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {isCreating || !selectedService ? 'New service' : 'Service details'}
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                {isCreating || !selectedService
                  ? 'Create a new billable task for a tenant.'
                  : `Created ${new Date(selectedService.createdAt).toLocaleDateString()}`}
              </p>
            </div>
            {selectedService && !isCreating && (
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {/* Tenant ID */}
            <label className="text-sm">
              <span className="mb-1 block font-medium">Tenant ID</span>
              <input
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                disabled={!!selectedService && !isCreating}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 disabled:opacity-50"
                placeholder="e.g. restaurant-warsaw"
              />
            </label>

            {/* Title */}
            <label className="text-sm">
              <span className="mb-1 block font-medium">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                placeholder="Add 3D object to Hero section"
              />
            </label>

            {/* Price */}
            <label className="text-sm">
              <span className="mb-1 block font-medium">Price</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
              />
            </label>

            {/* Currency */}
            <label className="text-sm">
              <span className="mb-1 block font-medium">Currency</span>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
              >
                <option value="pln">PLN</option>
                <option value="eur">EUR</option>
                <option value="usd">USD</option>
              </select>
            </label>

            {/* Priority */}
            <label className="text-sm">
              <span className="mb-1 block font-medium">Priority</span>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as 'low' | 'medium' | 'high' })
                }
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            {/* Status (only when editing) */}
            {selectedService && !isCreating && (
              <label className="text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <select
                  value={selectedService.status}
                  onChange={(e) => handleStatusChange(selectedService, e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Description — full width */}
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block font-medium">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 resize-none"
                placeholder="Optional description for the tenant…"
              />
            </label>

            {/* Notes — full width (admin-only) */}
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block font-medium">Internal notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 resize-none"
                placeholder="Private notes (not visible to tenant)…"
              />
            </label>
          </div>

          {/* Payment info (read-only when editing) */}
          {selectedService && !isCreating && selectedService.paymentIntentId && (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--text-muted)]">
              <span className="font-medium">Payment:</span>{' '}
              {selectedService.paidAt
                ? `Paid on ${new Date(selectedService.paidAt).toLocaleDateString()}`
                : `Payment initiated (${selectedService.paymentIntentId.slice(0, 12)}…)`}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
