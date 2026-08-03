// src/widgets/DemoQuiz/steps/Step1BusinessType.tsx
'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  ShoppingBag,
  Sparkles,
  Scissors,
  Dumbbell,
  BedDouble,
  Car,
  MoreHorizontal,
} from 'lucide-react';
import { useDemoQuizStore } from '@/features/demoQuiz/model/demoQuizStore';
import { BUSINESS_TYPE_PRESETS } from '@/features/demoQuiz/model/schema';
import { cn } from '@/shared/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  restaurant: UtensilsCrossed,
  ecommerce: ShoppingBag,
  beautySalon: Sparkles,
  barbershop: Scissors,
  gym: Dumbbell,
  hotel: BedDouble,
  auto: Car,
  other: MoreHorizontal,
};

export default function Step1BusinessType() {
  const t = useTranslations('demoQuiz');
  const { businessType, setBusinessTypePreset, setBusinessTypeCustom } =
    useDemoQuizStore();

  const selectedPreset = businessType.preset;
  const isOther = !!businessType.custom?.trim();

  return (
    <div className="space-y-6">
      <header className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t('step1.title')}
        </h2>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-md mx-auto">
          {t('step1.subtitle')}
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {BUSINESS_TYPE_PRESETS.map((key, idx) => {
          const Icon = ICONS[key] ?? MoreHorizontal;
          const isSelected = selectedPreset === key;
          return (
            <motion.button
              key={key}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
              onClick={() => {
                if (key === 'other') {
                  setBusinessTypePreset(null);
                } else {
                  setBusinessTypePreset(key);
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 sm:p-5 text-center transition-all',
                'min-h-[110px] sm:min-h-[120px]',
                isSelected
                  ? 'border-[var(--primary-color)] bg-[color-mix(in_srgb,var(--primary-color)_8%,transparent)] shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-color)]/50 hover:-translate-y-0.5'
              )}
            >
              <Icon
                className={cn(
                  'h-7 w-7 sm:h-8 sm:w-8',
                  isSelected
                    ? 'text-[var(--primary-color)]'
                    : 'text-[var(--text-muted)]'
                )}
              />
              <span
                className={cn(
                  'text-sm font-semibold leading-tight',
                  isSelected ? 'text-[var(--primary-color)]' : 'text-[var(--text)]'
                )}
              >
                {t(`step1.options.${key}`)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom "Other" input — slides up when "Other" is selected */}
      <motion.div
        initial={false}
        animate={{
          height: isOther ? 'auto' : 0,
          opacity: isOther ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <div className="pt-2">
          <label className="block text-sm font-semibold text-[var(--text-muted)] mb-1.5">
            {t('step1.otherPlaceholder')}
          </label>
          <input
            type="text"
            value={businessType.custom ?? ''}
            onChange={(e) => setBusinessTypeCustom(e.target.value)}
            placeholder={t('step1.otherPlaceholder')}
            className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-base focus:outline-none focus:border-[var(--primary-color)] transition-colors"
          />
        </div>
      </motion.div>
    </div>
  );
}
