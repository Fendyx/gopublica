'use client';

import Link from 'next/link';
import { createElement } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import type { SolutionModule } from '@/content/solutions/types';
import { getSolutionIcon } from './icons';

interface Props {
  module: SolutionModule;
}

/**
 * Компактная строка списка (List View) для модуля Solutions.
 * Вместо громоздких фото — минималистичная векторная иконка Lucide.
 */
export function SolutionRow({ module }: Props) {
  const t = useTranslations('solutions');
  const Icon = getSolutionIcon(module.id);

  return (
    <Link
      href={`/solutions/${module.slug}`}
      className="group relative flex items-center gap-4 sm:gap-5 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* Иконка в мягком брендовом квадрате */}
      <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
        {/* createElement вместо JSX: lint-правило react-hooks/static-components
            ошибочно считает присвоение иконки переменной созданием компонента */}
        {Icon
          ? createElement(Icon, {
              className: 'h-5 w-5 sm:h-[22px] sm:w-[22px]',
              strokeWidth: 1.75,
            })
          : (
          <span className="text-sm font-bold text-brand group-hover:text-white">
            {module.id.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Текстовый блок */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3 className="text-[15px] sm:text-base font-semibold leading-snug" style={{ color: '#111827' }}>
            {t(`modules.${module.id}.title`)}
          </h3>
        </div>
        <p className="mt-1 text-sm leading-relaxed line-clamp-2" style={{ color: '#6b7280' }}>
          {t(`modules.${module.id}.desc`)}
        </p>
      </div>

      {/* Стрелка-индикатор */}
      <ArrowUpRight className="h-5 w-5 shrink-0 text-body-muted/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
    </Link>
  );
}
