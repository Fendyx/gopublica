import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { SolutionModule } from '@/content/solutions/types';

interface Props {
  module: SolutionModule;
}

export function SolutionCard({ module }: Props) {
  const t = useTranslations('solutions');

  return (
    <Link
      href={`/solutions/${module.slug}`}
      className="group block bg-surface rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-border h-full flex flex-col"
    >
      {/* Видео-превью */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden flex-shrink-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => e.currentTarget.pause()}
        >
          <source src={module.videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {module.badge && (
          <span
            className={`absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
              module.badge === 'included'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-200'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/70 dark:text-purple-200'
            }`}
          >
            {t(`badge.${module.badge}`)}
          </span>
        )}
      </div>

      {/* Текстовый блок — растягивается на всю оставшуюся высоту */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-body">
          {t(`modules.${module.id}.title`)}
        </h3>
        <p className="mt-2 text-sm text-body-muted line-clamp-2 flex-grow">
          {t(`modules.${module.id}.desc`)}
        </p>
        {/* Кнопка прижимается к низу */}
        <span className="mt-4 inline-flex items-center text-sm font-medium text-brand">
          {t('card.learnMore')}
        </span>
      </div>
    </Link>
  );
}