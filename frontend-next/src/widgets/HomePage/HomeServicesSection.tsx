'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useLazyVideoAutoplay } from '@/shared/ui/useVideoVisibility';

/* ── Service data ─────────────────────────────────────────────────────────── */

const services = [
  {
    key: 'websites',
    type: 'image' as const,
    mediaSrc: '',
    imageSrc: '/images/quovadis-website.png',
    href: '/solutions',
  },
  {
    key: 'nfcCards',
    type: 'image' as const,
    mediaSrc: '',
    imageSrc: '/images/nfc_gopublica.jpg',
    href: '/solutions',
  },
  {
    key: 'video',
    type: 'video' as const,
    mediaSrc: '',
    imageSrc: '',
    href: '/solutions',
  },
] as const;

/* ── MediaCard ────────────────────────────────────────────────────────────── */

function MediaCard({ svc }: { svc: (typeof services)[number] }) {
  const t = useTranslations('home');
  const videoRef = useLazyVideoAutoplay(svc.type === 'video' ? svc.mediaSrc : '');

  return (
    <Link
      href={svc.href}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white dark:bg-neutral-900 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* Media — strict 16:9, no cropping */}
      <div className="relative w-full aspect-video bg-gray-100 dark:bg-neutral-800">
        {svc.type === 'video' ? (
          <video
            ref={videoRef}
            loop
            muted
            playsInline
            preload="none"
            className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : svc.imageSrc ? (
          <img
            src={svc.imageSrc}
            alt={t(`services.${svc.key}.title`)}
            className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--surface)] to-[var(--bg)]" />
        )}
      </div>

      {/* Text — sits below the media */}
      <div className="p-6 flex flex-col gap-2">
        <h3 className="font-bold text-xl md:text-2xl text-[var(--text)] transition-colors duration-300">
          {t(`services.${svc.key}.title`)}
        </h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {t(`services.${svc.key}.desc`)}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] mt-1 opacity-0 group-hover:opacity-100 transition-all duration-400 delay-100">
          Learn more <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

/* ── Main Section ─────────────────────────────────────────────────────────── */

export default function HomeServicesSection() {
  const t = useTranslations('home');

  return (
    <section className="py-24 px-6 bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-4">
            {t('servicesTitle')}
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            {t('servicesSubtitle')}
          </p>
        </div>

        {/* Cards — stacked on mobile, 3-up horizontal grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
          {services.map((svc) => (
            <MediaCard key={svc.key} svc={svc} />
          ))}
        </div>
      </div>
    </section>
  );
}
