'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/shared/ui/Button';
import { Card, CardTitle, CardContent } from '@/shared/ui/Card';
import {
  fetchAllNews,
  createNews,
  updateNews,
  deleteNews,
} from '@/entities/platformNews/api/newsApi';
import type { PlatformNews, PlatformNewsFormData } from '@/entities/platformNews/model/types';
import { EMPTY_NEWS_FORM } from '@/entities/platformNews/model/types';
import {
  Plus, Search, Trash2, Edit3, Save, X, Megaphone, Clock,
} from 'lucide-react';

const LOCALES = ['en', 'de', 'pl', 'uk'];
const TYPE_OPTIONS = ['info', 'update', 'announcement', 'promo'] as const;
const TYPE_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  update: 'bg-green-100 text-green-700',
  announcement: 'bg-purple-100 text-purple-700',
  promo: 'bg-orange-100 text-orange-700',
};

export default function PlatformNewsAdminPage() {
  const [news, setNews] = useState<PlatformNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<PlatformNewsFormData>(EMPTY_NEWS_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editLocale, setEditLocale] = useState<string | null>(null);

  const loadNews = async () => {
    try {
      const data = await fetchAllNews();
      setNews(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return news;
    const q = search.toLowerCase();
    return news.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
    );
  }, [news, search]);

  const selected = useMemo(
    () => news.find((n) => n._id === selectedId) || null,
    [news, selectedId]
  );

  const set = (key: keyof PlatformNewsFormData, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setTranslation = (lang: string, field: 'titleI18n' | 'contentI18n', value: string) =>
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));

  const handleNew = () => {
    setIsCreating(true);
    setSelectedId(null);
    setForm({ ...EMPTY_NEWS_FORM });
    setEditLocale(null);
  };

  const handleSelect = (n: PlatformNews) => {
    setIsCreating(false);
    setSelectedId(n._id);
    setEditLocale(null);
    setForm({
      title: n.title,
      titleI18n: n.titleI18n || {},
      content: n.content,
      contentI18n: n.contentI18n || {},
      type: n.type,
      isActive: n.isActive,
      publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString().slice(0, 16) : '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isCreating) {
        const created = await createNews(form);
        setNews((prev) => [created, ...prev]);
        setSelectedId(created._id);
        setIsCreating(false);
      } else if (selectedId) {
        const updated = await updateNews(selectedId, form);
        setNews((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this news item?')) return;
    try {
      await deleteNews(id);
      setNews((prev) => prev.filter((n) => n._id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-[var(--text-muted)]">Loading news…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ─── LEFT: List ─── */}
      <div className="lg:w-1/2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Megaphone className="w-5 h-5" /> Platform News
          </h1>
          <Button onClick={handleNew} size="sm">
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search news…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
          />
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filtered.map((n) => (
            <div
              key={n._id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedId === n._id
                  ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/5'
                  : 'border-[var(--border)] hover:border-[var(--primary-color)]/40'
              } ${!n.isActive ? 'opacity-50' : ''}`}
              onClick={() => handleSelect(n)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        TYPE_COLORS[n.type] || ''
                      }`}
                    >
                      {n.type}
                    </span>
                    {!n.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                        draft
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{n.title}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{n.content}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(n._id);
                  }}
                  className="ml-2 p-1 rounded hover:bg-red-100 text-[var(--text-muted)] hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No news found.</p>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Form ─── */}
      <div className="lg:w-1/2">
        <Card>
          <CardTitle className="flex items-center gap-2 mb-4">
            <Edit3 className="w-4 h-4" />
            {isCreating ? 'New News' : selected ? 'Edit News' : 'Select a news item'}
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

                {/* Type */}
                <div>
                  <label className="block text-xs font-medium mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => set('type', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-medium mb-1">Content (default)</label>
                  <textarea
                    rows={5}
                    value={form.content}
                    onChange={(e) => set('content', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                </div>

                {/* Published At */}
                <div>
                  <label className="block text-xs font-medium mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) => set('publishedAt', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => set('isActive', e.target.checked)}
                    className="rounded"
                  />
                  <label className="text-xs font-medium">Active (visible to tenants)</label>
                </div>

                {/* Translations */}
                <div>
                  <label className="block text-xs font-medium mb-2">Translations</label>
                  <div className="flex gap-1 mb-2">
                    {LOCALES.map((l) => (
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
                          Content ({editLocale.toUpperCase()})
                        </label>
                        <textarea
                          rows={3}
                          value={form.contentI18n[editLocale] || ''}
                          onChange={(e) =>
                            setTranslation(editLocale, 'contentI18n', e.target.value)
                          }
                          placeholder={`Content in ${editLocale.toUpperCase()}…`}
                          className="w-full px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-sm"
                        />
                      </div>
                    </div>
                  )}
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
                      setForm({ ...EMPTY_NEWS_FORM });
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
                Select a news item to edit, or click "New" to create one.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
