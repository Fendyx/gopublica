'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { fetchPinnedNews } from '@/entities/siteNews/api/siteNewsApi';
import type { GoPublicaNews } from '@/entities/siteNews/model/types';
import { resolveI18n } from '@/entities/siteNews/model/types';
import { ArrowRight, Clock } from 'lucide-react';

function isExternalVideoUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be|vimeo\.com)/.test(url);
}

const CATEGORY_COLORS: Record<string, string> = {
  company: 'bg-blue-100 text-blue-700',
  product: 'bg-green-100 text-green-700',
  event: 'bg-purple-100 text-purple-700',
  tutorial: 'bg-amber-100 text-amber-700',
  announcement: 'bg-rose-100 text-rose-700',
};

export default function HomeNewsSection() {
  const locale = useLocale();
  const [items, setItems] = useState<GoPublicaNews[]>([]);

  useEffect(() => {
    fetchPinnedNews()
      .then(setItems)
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const formatDate = (d: string | null) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <section className="py-16 bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Latest News</h2>
          <Link
            href={`/${locale}/news`}
            className="text-sm text-[var(--primary-color)] hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Link
              key={item._id}
              href={`/${locale}/news/${item.slug}`}
              className="group block rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-lg transition-all bg-[var(--bg)]"
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
                    alt={resolveI18n(item.title, item.titleI18n, locale)}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary-color)]/10 to-[var(--primary-color)]/5">
                    <span className="text-3xl opacity-30">📰</span>
                  </div>
                )}
                {item.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
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
                    {item.category}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-[var(--primary-color)] transition-colors line-clamp-2">
                  {resolveI18n(item.title, item.titleI18n, locale)}
                </h3>
                {item.excerpt && (
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">
                    {resolveI18n(item.excerpt, item.excerptI18n, locale)}
                  </p>
                )}
                {item.publishedAt && (
                  <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(item.publishedAt)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
