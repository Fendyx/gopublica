import { getTranslations } from 'next-intl/server';
import type { SolutionModule } from '@/content/solutions/types';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  module: SolutionModule;
}

export async function SolutionDetail({ module }: Props) {
  const t = await getTranslations('solutions.modules');
  const ct = await getTranslations('solutions.detail');

  const title = t(`${module.id}.title`);
  const heroDesc = t(`${module.id}.heroDesc`) ?? t(`${module.id}.desc`);

  return (
    <main className="min-h-screen bg-base">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">

        {/* Split: text left — video right */}
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-6">

            {/* Thin brand accent + title */}
            <div className="border-l-2 border-brand pl-5">
              <h1 className="text-4xl font-bold tracking-tight text-body sm:text-5xl leading-tight">
                {title}
              </h1>
            </div>

            <p className="text-lg text-body-muted leading-relaxed">
              {heroDesc}
            </p>

            {/* Benefits — simple checklist, no heavy cards */}
            <ul className="flex flex-col gap-4 mt-1">
              {(['item1', 'item2', 'item3'] as const).map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-5 h-5 text-brand mt-0.5 shrink-0"
                    strokeWidth={2}
                  />
                  <div className="text-sm leading-relaxed">
                    <span className="font-semibold text-body">
                      {ct(`benefits.${key}.title`)}
                    </span>
                    {' '}
                    <span className="text-body-muted">
                      — {ct(`benefits.${key}.desc`)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/contact?ref=solutions"
              className="mt-2 self-start rounded-full bg-brand px-7 py-3.5 text-white text-sm font-semibold tracking-wide hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {ct('cta')}
            </Link>
          </div>

          {/* ── Right column: video ── */}
          <div className="relative">
            {/* Subtle glow behind the video */}
            <div
              className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl bg-brand pointer-events-none"
              aria-hidden
            />
            <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-black aspect-video">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={module.videoSrc} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}