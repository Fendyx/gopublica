'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/Button';
import { ExternalLink, UtensilsCrossed, CalendarCheck, LayoutGrid } from 'lucide-react';

const FEATURE_ICONS = {
  onlineOrdering: UtensilsCrossed,
  crmIntegration: CalendarCheck,
  menuManagement: LayoutGrid,
};

export default function AgencyFoodPage() {
  const t = useTranslations('agencyFood');

  return (
    <div className="relative w-full">
      {/*
        ── 1. ВИДЕО: STICKY ВМЕСТО FIXED ─────────────────────────────────────
        sticky прилепляет блок к верху экрана во время скролла.
        Это надежнее, так как не ломается от родительских transform или z-index.
      */}
      <div className="sticky left-0 top-0 z-0 h-screen w-full overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          poster="/videos/food-poster.jpg"
        >
          <source src="/videos/food-demo.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/65" />
      </div>

      {/*
        ── 2. КОНТЕНТ: ОТРИЦАТЕЛЬНЫЙ ОТСТУП ──────────────────────────────────
        -mt-[100vh] поднимает весь этот блок вверх ровно на высоту экрана,
        натягивая его поверх sticky-видео.
      */}
      <div className="relative z-10 -mt-[100vh]">
        
        {/*
          ── HERO: прозрачный фон ─────────────────────────────────────────────
          Поскольку фон прозрачный, через него видно прилипшее видео.
        */}
        <section className="flex h-screen items-end px-6 pb-20">
          <div className="mx-auto w-full max-w-5xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/60">
              {t('heroEyebrow', { defaultValue: 'Digital solutions for restaurants' })}
            </p>
            <h1 className="mb-5 max-w-2xl text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl">
              {t('heroTitle')}
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/75">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="gap-2 rounded-full bg-white px-7 text-black hover:bg-white/90"
              >
                <ExternalLink size={16} />
                {t('visitDemo')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-white/10 px-7 text-white hover:bg-white/20 hover:text-white"
              >
                {t('learnMore', { defaultValue: 'See how it works' })}
              </Button>
            </div>
          </div>
        </section>

        {/*
          ── ОСНОВНОЙ КОНТЕНТ: белый фон ──────────────────────────────────────
          При скролле этот блок будет "наезжать" поверх видео снизу вверх.
        */}
        <div className="overflow-hidden rounded-t-[2.5rem] bg-[var(--surface)] shadow-[0_-8px_60px_rgba(0,0,0,0.18)]">
          {/* Обзорный блок */}
          <section className="mx-auto max-w-5xl px-6 py-20">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {t('overviewEyebrow', { defaultValue: 'What we build' })}
              </p>
              <h2 className="mb-4 text-4xl font-bold tracking-tight text-[var(--text)]">
                {t('overviewTitle')}
              </h2>
              <p className="text-lg leading-relaxed text-[var(--text-muted)]">
                {t('overviewText')}
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {(['onlineOrdering', 'crmIntegration', 'menuManagement'] as const).map((feat) => {
                const Icon = FEATURE_ICONS[feat];
                return (
                  <div
                    key={feat}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-4 inline-flex rounded-xl bg-[var(--surface)] p-3 shadow-sm ring-1 ring-[var(--border)]">
                      <Icon size={22} className="text-[var(--primary-color)]" strokeWidth={1.5} />
                    </div>
                    <h3 className="mb-2 font-semibold text-[var(--text)]">
                      {t(`features.${feat}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      {t(`features.${feat}.desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="mx-6 border-[var(--border)]" />

          {/* Секция решений */}
          <section className="bg-[var(--bg)] px-6 py-20">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 max-w-xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  {t('solutionsEyebrow', { defaultValue: 'Our solutions' })}
                </p>
                <h2 className="text-4xl font-bold tracking-tight text-[var(--text)]">
                  {t('solutionsTitle')}
                </h2>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                {(['website', 'reservations'] as const).map((key) => (
                  <div key={key} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
                    <h3 className="mb-3 text-xl font-semibold text-[var(--text)]">
                      {t(`solutions.${key}`)}
                    </h3>
                    <p className="leading-relaxed text-[var(--text-muted)]">
                      {t(`solutions.${key}Desc`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-20 text-center">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-3 text-3xl font-bold tracking-tight text-[var(--text)]">
                {t('ctaTitle', { defaultValue: 'Ready to see it live?' })}
              </h2>
              <p className="mb-8 text-[var(--text-muted)]">
                {t('ctaSubtitle', { defaultValue: 'Explore a fully working demo' })}
              </p>
              <Button size="lg" className="gap-2 rounded-full px-8">
                <ExternalLink size={16} />
                {t('visitDemo')}
              </Button>
            </div>
          </section>
        </div>
        
      </div>
    </div>
  );
}