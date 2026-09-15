'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/shared/ui/Button';
import { Card, CardTitle, CardContent } from '@/shared/ui/Card';
import {
  fetchAllSiteNews,
  createSiteNews,
  updateSiteNews,
  deleteSiteNews,
} from '@/entities/siteNews/api/siteNewsApi';
import type {
  GoPublicaNews,
  GoPublicaNewsFormData,
  NewsCategory,
  NewsMediaType,
} from '@/entities/siteNews/model/types';
import { EMPTY_SITE_NEWS_FORM } from '@/entities/siteNews/model/types';
import { LOCALE_CODES } from '@/shared/lib/locales';
import { useCloudinaryUpload } from '@/shared/lib/useCloudinaryUpload';
import { SiteNewsEditor } from '@/features/siteNews/ui/SiteNewsEditor';
import {
  Plus, Search, Trash2, Edit3, Save, X, Newspaper, Clock,
  Upload, Pin, Image as ImageIcon, Video,
} from 'lucide-react';

const CATEGORY_OPTIONS: { value: NewsCategory; label: string }[] = [
  { value: 'company', label: 'Company' },
  { value: 'product', label: 'Product' },
  { value: 'event', label: 'Event' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'announcement', label: 'Announcement' },
];
const CATEGORY_COLORS: Record<string, string> = {
  company: 'bg-blue-100 text-blue-700',
  product: 'bg-green-100 text-green-700',
  event: 'bg-purple-100 text-purple-700',
  tutorial: 'bg-amber-100 text-amber-700',
  announcement: 'bg-rose-100 text-rose-700',
};
const MEDIA_COLORS: Record<string, string> = {
  text: 'bg-gray-100 text-gray-600',
  photo: 'bg-sky-100 text-sky-700',
  video: 'bg-violet-100 text-violet-700',
};

export default function SiteNewsAdminPage() {
  const [news, setNews] = useState<GoPublicaNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<GoPublicaNewsFormData>(EMPTY_SITE_NEWS_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editLocale, setEditLocale] = useState<string | null>(null);

  // Cloudinary uploads
  const { openWidget: openImageUpload } = useCloudinaryUpload({
    onSuccess: (url) => set('coverImage', url),
    resourceType: 'image',
  });
  const { openWidget: openVideoUpload } = useCloudinaryUpload({
    onSuccess: (url) => set('videoUrl', url),
    resourceType: 'video',
  });

  const loadNews = async () => {
    try {
      const data = await fetchAllSiteNews();
      setNews(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNews(); }, []);

  const filtered = useMemo(() => {
    let items = news;
    if (categoryFilter) items = items.filter((n) => n.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.category.toLowerCase().includes(q) ||
          n.mediaType.toLowerCase().includes(q),
      );
    }
    return items;
  }, [news, search, categoryFilter]);

  const selected = useMemo(
    () => news.find((n) => n._id === selectedId) || null,
    [news, selectedId],
  );

  const set = (key: keyof GoPublicaNewsFormData, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setTranslation = (
    lang: string,
    field: 'titleI18n' | 'excerptI18n' | 'bodyI18n' | 'seoTitleI18n' | 'seoDescriptionI18n',
    value: string,
  ) =>
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [lang]: value },
    }));

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    set('title', title);
    if (isCreating && !form.slug) {
      set(
        'slug',
        title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, ''),
      );
    }
  };

  const handleNew = () => {
    setIsCreating(true);
    setSelectedId(null);
    setForm({ ...EMPTY_SITE_NEWS_FORM });
    setEditLocale(null);
  };

  const handleSelect = (n: GoPublicaNews) => {
    setIsCreating(false);
    setSelectedId(n._id);
    setEditLocale(null);
    setForm({
      title: n.title,
      titleI18n: n.titleI18n || {},
      slug: n.slug,
      category: n.category,
      mediaType: n.mediaType,
      coverImage: n.coverImage || '',
      videoUrl: n.videoUrl || '',
      body: n.body || '',
      bodyI18n: n.bodyI18n || {},
      excerpt: n.excerpt || '',
      excerptI18n: n.excerptI18n || {},
      seoTitle: n.seoTitle || '',
      seoTitleI18n: n.seoTitleI18n || {},
      seoDescription: n.seoDescription || '',
      seoDescriptionI18n: n.seoDescriptionI18n || {},
      author: n.author || 'GoPublica Team',
      isPinned: n.isPinned,
      pinnedOrder: n.pinnedOrder,
      isActive: n.isActive,
      publishedAt: n.publishedAt
        ? new Date(n.publishedAt).toISOString().slice(0, 16)
        : '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isCreating) {
        const created = await createSiteNews(form);
        setNews((prev) => [created, ...prev]);
        setSelectedId(created._id);
        setIsCreating(false);
      } else if (selectedId) {
        const updated = await updateSiteNews(selectedId, form);
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
      await deleteSiteNews(id);
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
            <Newspaper className="w-5 h-5" /> Site News
          </h1>
          <Button onClick={handleNew} size="sm">
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        {/* Search + Category filter */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search news…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
          >
            <option value="">All</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_COLORS[n.category] || ''}`}>
                      {n.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${MEDIA_COLORS[n.mediaType] || ''}`}>
                      {n.mediaType}
                    </span>
                    {n.isPinned && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700">📌 pinned</span>
                    )}
                    {!n.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">draft</span>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{n.title}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{n.excerpt || n.body?.replace(/<[^>]*>/g, '').slice(0, 80)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
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
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-medium mb-1">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => set('slug', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                </div>

                {/* Category + Media Type */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Media Type</label>
                    <select
                      value={form.mediaType}
                      onChange={(e) => set('mediaType', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                    >
                      <option value="text">Text only</option>
                      <option value="photo">Photo + Text</option>
                      <option value="video">Video + Text</option>
                    </select>
                  </div>
                </div>

                {/* Cover Image (for photo/video) */}
                {form.mediaType !== 'text' && (
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      <ImageIcon className="w-3 h-3 inline mr-1" />
                      Cover Image
                    </label>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={openImageUpload}>
                        <Upload className="w-4 h-4 mr-1" /> Upload Image
                      </Button>
                      {form.coverImage && (
                        <button
                          type="button"
                          onClick={() => set('coverImage', '')}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {form.coverImage && (
                      <img
                        src={form.coverImage}
                        alt="Cover preview"
                        className="mt-2 rounded-lg max-h-40 object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Video (for video type) */}
                {form.mediaType === 'video' && (
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      <Video className="w-3 h-3 inline mr-1" />
                      Video
                    </label>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={openVideoUpload}>
                        <Upload className="w-4 h-4 mr-1" /> Upload Video
                      </Button>
                      {form.videoUrl && (
                        <button
                          type="button"
                          onClick={() => set('videoUrl', '')}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {form.videoUrl && (
                      <video
                        src={form.videoUrl}
                        controls
                        className="mt-2 rounded-lg max-h-48 w-full"
                      />
                    )}
                  </div>
                )}

                {/* Excerpt */}
                <div>
                  <label className="block text-xs font-medium mb-1">Excerpt (max 280 chars)</label>
                  <textarea
                    rows={2}
                    maxLength={280}
                    value={form.excerpt}
                    onChange={(e) => set('excerpt', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">{form.excerpt.length}/280</p>
                </div>

                {/* Body (TipTap) */}
                <div>
                  <label className="block text-xs font-medium mb-1">Content (default)</label>
                  <SiteNewsEditor body={form.body} onChange={(html) => set('body', html)} />
                </div>

                {/* SEO */}
                <div className="space-y-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50">
                  <p className="text-xs font-medium text-[var(--text-muted)]">SEO</p>
                  <input
                    value={form.seoTitle}
                    onChange={(e) => set('seoTitle', e.target.value)}
                    placeholder="SEO Title"
                    className="w-full px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                  <textarea
                    rows={2}
                    value={form.seoDescription}
                    onChange={(e) => set('seoDescription', e.target.value)}
                    placeholder="SEO Description"
                    className="w-full px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-xs font-medium mb-1">Author</label>
                  <input
                    value={form.author}
                    onChange={(e) => set('author', e.target.value)}
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

                {/* Active + Pinned */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => set('isActive', e.target.checked)}
                      className="rounded"
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={form.isPinned}
                      onChange={(e) => set('isPinned', e.target.checked)}
                      className="rounded"
                    />
                    <Pin className="w-3 h-3" />
                    Pin to Homepage
                  </label>
                  {form.isPinned && (
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-[var(--text-muted)]">Order:</label>
                      <input
                        type="number"
                        value={form.pinnedOrder}
                        onChange={(e) => set('pinnedOrder', parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-xs"
                      />
                    </div>
                  )}
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
                          Excerpt ({editLocale.toUpperCase()})
                        </label>
                        <textarea
                          rows={2}
                          value={form.excerptI18n[editLocale] || ''}
                          onChange={(e) => setTranslation(editLocale, 'excerptI18n', e.target.value)}
                          placeholder={`Excerpt in ${editLocale.toUpperCase()}…`}
                          className="w-full px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Body ({editLocale.toUpperCase()})
                        </label>
                        <SiteNewsEditor
                          body={form.bodyI18n[editLocale] || ''}
                          onChange={(html) => setTranslation(editLocale, 'bodyI18n', html)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          SEO Title ({editLocale.toUpperCase()})
                        </label>
                        <input
                          value={form.seoTitleI18n[editLocale] || ''}
                          onChange={(e) => setTranslation(editLocale, 'seoTitleI18n', e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          SEO Description ({editLocale.toUpperCase()})
                        </label>
                        <textarea
                          rows={2}
                          value={form.seoDescriptionI18n[editLocale] || ''}
                          onChange={(e) => setTranslation(editLocale, 'seoDescriptionI18n', e.target.value)}
                          className="w-full px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Save / Cancel */}
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
                      setForm({ ...EMPTY_SITE_NEWS_FORM });
                    }}
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          )}

          {!isCreating && !selected && (
            <CardContent>
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                Select a news item to edit or create a new one.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
