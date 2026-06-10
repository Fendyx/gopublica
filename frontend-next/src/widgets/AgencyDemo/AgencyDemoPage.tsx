'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/Button';
import { ExternalLink } from 'lucide-react';

type Feature = {
  key: string;
  icon: React.ReactNode;
};

type Props = {
  namespace: string; // 'agencyFood' | 'agencyGrooming' | 'agencySalon' | 'agencyOther'
  videoSrc: string;
  posterSrc: string;
  demoUrl: string;
  features: Feature[];
};

export default function AgencyDemoPage({ namespace, videoSrc, posterSrc, demoUrl, features }: Props) {
  const t = useTranslations(namespace);

  return (
    <div>
      {/* Sticky-видео */}
      <div className="sticky top-0 h-screen overflow-hidden z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster={posterSrc}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{t('heroTitle')}</h1>
            <p className="text-lg md:text-xl opacity-80 mb-8">{t('heroSubtitle')}</p>
            <a href={demoUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-gray-100">
                <ExternalLink size={18} />
                {t('visitDemo')}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Наезжающая секция */}
      <div className="relative z-10 -mt-32 bg-[var(--surface)] rounded-t-3xl shadow-2xl">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-6">{t('overviewTitle')}</h2>
          <p className="text-lg text-[var(--text-muted)] mb-8">{t('overviewText')}</p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {features.map(({ key, icon }) => (
              <div key={key} className="p-6 rounded-2xl border border-[var(--border)]">
                <div className="text-[var(--primary-color)] mb-4">{icon}</div>
                <h3 className="font-semibold text-lg mb-2">{t(`features.${key}.title`)}</h3>
                <p className="text-sm text-[var(--text-muted)]">{t(`features.${key}.desc`)}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a href={demoUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2">
                <ExternalLink size={18} />
                {t('visitDemo')}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Дополнительные решения */}
      <div className="bg-[var(--bg)] py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{t('solutionsTitle')}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Решения из переводов (универсально: solutions.0.title/desc и т.д.) */}
            {['solution1', 'solution2'].map((sol) => (
              <div key={sol}>
                <h3 className="font-semibold text-xl mb-4">{t(`solutions.${sol}.title`)}</h3>
                <p className="text-[var(--text-muted)]">{t(`solutions.${sol}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}