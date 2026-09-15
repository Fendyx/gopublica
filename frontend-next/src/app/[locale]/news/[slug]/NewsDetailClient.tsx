'use client';

import Link from 'next/link';
import type { GoPublicaNews } from '@/entities/siteNews/model/types';
import { resolveI18n } from '@/entities/siteNews/model/types';
import { ArrowLeft, Clock, User, Share2 } from 'lucide-react';

/* ---------- Video URL helpers ---------- */
function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(url);
}

function isVimeoUrl(url: string): boolean {
  return /vimeo\.com\/\d+/.test(url);
}

function getVideoEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

/* ---------- Video player that adapts to any aspect ratio ---------- */
function AdaptiveVideo({ src }: { src: string }) {
  if (isYouTubeUrl(src) || isVimeoUrl(src)) {
    return (
      <div className="relative w-full max-w-3xl mx-auto aspect-video">
        <iframe
          src={getVideoEmbedUrl(src)}
          className="absolute inset-0 w-full h-full rounded-xl"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }
  return (
    <video
      src={src}
      controls
      className="max-w-full max-h-[80vh] h-auto block object-contain rounded-xl"
      preload="metadata"
    />
  );
}

const CATEGORY_LABELS: Record<string, string> = {
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

interface Props {
  item: GoPublicaNews;
  locale: string;
}

export default function NewsDetailClient({ item, locale }: Props) {
  const formatDate = (d: string | null) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const title = resolveI18n(item.title, item.titleI18n, locale);
  const body = resolveI18n(item.body, item.bodyI18n, locale);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <article className="min-h-screen">
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <Link
          href={`/${locale}/news`}
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to News
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[item.category] || ''}`}>
            {CATEGORY_LABELS[item.category] || item.category}
          </span>
          {item.mediaType !== 'text' && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {item.mediaType}
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
          {item.author && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> {item.author}
            </span>
          )}
          {item.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {formatDate(item.publishedAt)}
            </span>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 hover:text-[var(--primary-color)] transition-colors"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </header>

      {/* Cover media */}
      {item.mediaType !== 'text' && item.coverImage && (
        <div className="max-w-5xl mx-auto px-4 mb-8">
          <div className="rounded-xl overflow-hidden">
            <img
              src={item.coverImage}
              alt={title}
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        </div>
      )}

      {/* Content: video + body side-by-side on desktop */}
      <div className="max-w-6xl mx-auto px-4 mb-16 lg:flex lg:gap-12 lg:items-start">
        {/* Video – left column on desktop */}
        {item.mediaType === 'video' && item.videoUrl && (
          <div className="w-full lg:w-1/3 lg:max-w-[400px] shrink-0 mx-auto lg:mx-0 mb-8 lg:mb-0 lg:sticky lg:top-8">
            <div className="w-fit mx-auto lg:w-auto">
              <AdaptiveVideo src={item.videoUrl} />
            </div>
          </div>
        )}

        {/* Body – right column on desktop */}
        {body && (
          <div className="flex-1 w-full">
            <div
              className="prose prose-lg prose-headings:font-bold prose-a:text-[var(--primary-color)] max-w-none"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
