'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { fetchPublicNews } from '@/entities/siteNews/api/siteNewsApi';
import type { GoPublicaNews, NewsCategory } from '@/entities/siteNews/model/types';
import { Button } from '@/shared/ui/Button';
import { ChevronRight, Clock, User, ArrowLeft } from 'lucide-react';

function isExternalVideoUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be|vimeo\.com)/.test(url);
}

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  company: 'Company',
  product: 'Product',
  event: 'Event',
  tutorial: 'Tutorial',
  announcement: 'Announcement',
};
const CATEGORY_COLORS: Record<string, string> = {
  company: 'bg-blue-100 text-blue-700',
  product: 'bg-green-100 text-green-700',
  event: 'bg-purple-100 text-purple-700',
  tutorial: 'bg-amber-100 text-amber-700',
  announcement: 'bg-rose-100 text-rose-700',
};

export default function NewsListPage() {
  const locale = useLocale();
  const [items, setItems] = useState<GoPublicaNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState<string>('');
  const limit = 9;

  const load = useCallback(async (p: number, cat: string) => {
    setLoading(true);
    try {
      const res = await fetchPublicNews({ page: p, limit, category: cat || undefined });
      if (p === 1) {
        setItems(res.items);
      } else {
        setItems((prev) => [...prev, ...res.items]);
      }
      setTotal(res.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    load(1, category);
  }, [category, load]);

  const hasMore = items.length < total;

  const formatDate = (d: string | null) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[var(--primary-color)]/5 to-transparent py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">News &amp; Updates</h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl">
            Stay up to date with the latest from GoPublica — product updates, company news, tutorials, and events.
          </p>
        </div>
      </section>

      {/* Category filters */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !category
                ? 'bg-[var(--primary-color)] text-white'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary-color)]'
            }`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_LABELS) as NewsCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(category === cat ? '' : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-[var(--primary-color)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary-color)]'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Link
              key={item._id}
              href={`/${locale}/news/${item.slug}`}
              className="group block rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-lg transition-all bg-[var(--surface)]"
            >
              {/* Cover */}
              <div className="relative aspect-video overflow-hidden bg-black">
                {item.mediaType === 'video' && item.videoUrl && !isExternalVideoUrl(item.videoUrl) ? (
                  <video
                    src={item.videoUrl}
                    poster={item.coverImage || undefined}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary-color)]/10 to-[var(--primary-color)]/5">
                    <span className="text-4xl opacity-30">📰</span>
                  </div>
                )}
                {item.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_COLORS[item.category] || ''}`}>
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  {item.mediaType !== 'text' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                      {item.mediaType}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-base mb-1 group-hover:text-[var(--primary-color)] transition-colors line-clamp-2">
                  {item.title}
                </h3>
                {item.excerpt && (
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3">
                    {item.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  {item.author && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {item.author}
                    </span>
                  )}
                  {item.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(item.publishedAt)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[var(--text-muted)] text-lg">No news articles yet.</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <span className="text-[var(--text-muted)]">Loading…</span>
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && (
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => { const next = page + 1; setPage(next); load(next, category); }}>
              Load more <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
