'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/shared/ui/Button';
import { Card, CardTitle, CardContent } from '@/shared/ui/Card';
import {
  fetchAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/entities/platformProduct/api/productsApi';
import type {
  PlatformProduct,
  PlatformProductFormData,
  ProductSpec,
} from '@/entities/platformProduct/model/types';
import { EMPTY_PRODUCT_FORM } from '@/entities/platformProduct/model/types';
import { LOCALE_CODES } from '@/shared/lib/locales';
import {
  Plus, Search, Trash2, Edit3, Save, X, Package,
} from 'lucide-react';

const NICHE_OPTIONS = ['all', 'food', 'restaurant', 'beauty', 'auto', 'ecommerce'];
const CATEGORY_OPTIONS = ['hardware', 'digital', 'service'];

export default function PlatformProductsAdminPage() {
  const [products, setProducts] = useState<PlatformProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<PlatformProductFormData>(EMPTY_PRODUCT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editLocale, setEditLocale] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const data = await fetchAllProducts();
      setProducts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.targetNiches.some((n) => n.toLowerCase().includes(q))
    );
  }, [products, search]);

  const selected = useMemo(
    () => products.find((p) => p._id === selectedId) || null,
    [products, selectedId]
  );

  const set = (key: keyof PlatformProductFormData, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setTranslation = (lang: string, field: 'titleI18n' | 'descriptionI18n', value: string) =>
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));

  const handleNew = () => {
    setIsCreating(true);
    setSelectedId(null);
    setForm({ ...EMPTY_PRODUCT_FORM });
    setEditLocale(null);
  };

  const handleSelect = (p: PlatformProduct) => {
    setIsCreating(false);
    setSelectedId(p._id);
    setEditLocale(null);
    setForm({
      title: p.title,
      titleI18n: p.titleI18n || {},
      description: p.description,
      descriptionI18n: p.descriptionI18n || {},
      price: p.price,
      currency: p.currency,
      photo: p.photo,
      gallery: p.gallery || [],
      specs: p.specs || [],
      targetNiches: p.targetNiches || ['all'],
      category: p.category,
      isActive: p.isActive,
      stock: p.stock,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isCreating) {
        const created = await createProduct(form);
        setProducts((prev) => [created, ...prev]);
        setSelectedId(created._id);
        setIsCreating(false);
      } else if (selectedId) {
        const updated = await updateProduct(selectedId, form);
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, isActive: false } : p)));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const addSpec = () => {
    set('specs', [...form.specs, { key: '', value: '', keyI18n: {}, valueI18n: {} }]);
  };

  const updateSpec = (idx: number, field: keyof ProductSpec, value: any) => {
    const updated = [...form.specs];
    (updated[idx] as any)[field] = value;
    set('specs', updated);
  };

  const removeSpec = (idx: number) => {
    set('specs', form.specs.filter((_, i) => i !== idx));
  };

  const toggleNiche = (niche: string) => {
    if (niche === 'all') {
      set('targetNiches', ['all']);
    } else {
      const current = form.targetNiches.filter((n) => n !== 'all');
      if (current.includes(niche)) {
        const next = current.filter((n) => n !== niche);
        set('targetNiches', next.length === 0 ? ['all'] : next);
      } else {
        set('targetNiches', [...current, niche]);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-[var(--text-muted)]">Loading products…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ─── LEFT: List ─── */}
      <div className="lg:w-1/2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5" /> Platform Products
          </h1>
          <Button onClick={handleNew} size="sm">
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-2">{error}</p>
        )}

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filtered.map((p) => (
            <div
              key={p._id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedId === p._id
                  ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/5'
                  : 'border-[var(--border)] hover:border-[var(--primary-color)]/40'
              } ${!p.isActive ? 'opacity-50' : ''}`}
              onClick={() => handleSelect(p)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {p.category} · {p.targetNiches.join(', ')} · {p.currency} {p.price}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p._id);
                  }}
                  className="ml-2 p-1 rounded hover:bg-red-100 text-[var(--text-muted)] hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No products found.</p>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Form ─── */}
      <div className="lg:w-1/2">
        <Card>
          <CardTitle className="flex items-center gap-2 mb-4">
            <Edit3 className="w-4 h-4" />
            {isCreating ? 'New Product' : selected ? 'Edit Product' : 'Select a product'}
          </CardTitle>

          {(isCreating || selected) && (
            <CardContent>
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium mb-1">Title (default)</label>
                  <input
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                </div>

                {/* Price + Currency + Stock */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Currency</label>
                    <select
                      value={form.currency}
                      onChange={(e) => set('currency', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                    >
                      <option value="EUR">EUR</option>
                      <option value="PLN">PLN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Stock (-1=∞)</label>
                    <input
                      type="number"
                      min="-1"
                      value={form.stock}
                      onChange={(e) => set('stock', parseInt(e.target.value, 10) || -1)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                    />
                  </div>
                </div>

                {/* Photo URL */}
                <div>
                  <label className="block text-xs font-medium mb-1">Photo URL</label>
                  <input
                    value={form.photo}
                    onChange={(e) => set('photo', e.target.value)}
                    placeholder="https://…"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                  {form.photo && (
                    <img src={form.photo} alt="" className="mt-2 h-20 rounded object-cover" />
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium mb-1">Description (default)</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Niches */}
                <div>
                  <label className="block text-xs font-medium mb-1">Target Niches</label>
                  <div className="flex flex-wrap gap-2">
                    {NICHE_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => toggleNiche(n)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          form.targetNiches.includes(n)
                            ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]'
                            : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary-color)]/40'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => set('isActive', e.target.checked)}
                    className="rounded"
                  />
                  <label className="text-xs font-medium">Active</label>
                </div>

                {/* Translations */}
                <div>
                  <label className="block text-xs font-medium mb-2">Translations</label>
                  <div className="flex gap-1 mb-2">
                    {LOCALE_CODES.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setEditLocale(editLocale === l ? null : l)}
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          editLocale === l
                            ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]'
                            : 'border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {editLocale && (
                    <div className="space-y-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50">
                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Title ({editLocale.toUpperCase()})
                        </label>
                        <input
                          value={form.titleI18n[editLocale] || ''}
                          onChange={(e) => setTranslation(editLocale, 'titleI18n', e.target.value)}
                          placeholder={`Title in ${editLocale.toUpperCase()}…`}
                          className="w-full px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Description ({editLocale.toUpperCase()})
                        </label>
                        <textarea
                          rows={2}
                          value={form.descriptionI18n[editLocale] || ''}
                          onChange={(e) =>
                            setTranslation(editLocale, 'descriptionI18n', e.target.value)
                          }
                          placeholder={`Description in ${editLocale.toUpperCase()}…`}
                          className="w-full px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Specs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium">Specs</label>
                    <button
                      type="button"
                      onClick={addSpec}
                      className="text-xs text-[var(--primary-color)] hover:underline"
                    >
                      + Add spec
                    </button>
                  </div>
                  {form.specs.map((spec, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        value={spec.key}
                        onChange={(e) => updateSpec(idx, 'key', e.target.value)}
                        placeholder="Key"
                        className="flex-1 px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-sm"
                      />
                      <input
                        value={spec.value}
                        onChange={(e) => updateSpec(idx, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-sm"
                      />
                      <button
                        onClick={() => removeSpec(idx)}
                        className="p-1 text-[var(--text-muted)] hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Save */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving} size="sm">
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedId(null);
                      setForm({ ...EMPTY_PRODUCT_FORM });
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          )}

          {!isCreating && !selected && (
            <CardContent>
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                Select a product to edit, or click "New" to create one.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
