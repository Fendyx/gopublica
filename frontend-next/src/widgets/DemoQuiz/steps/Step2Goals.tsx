// src/widgets/DemoQuiz/steps/Step2Goals.tsx
'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Globe,
  CalendarCheck,
  UserPlus,
  Palette,
  Cog,
  MoreHorizontal,
} from 'lucide-react';
import { useDemoQuizStore } from '@/features/demoQuiz/model/demoQuizStore';
import { GOAL_PRESETS } from '@/features/demoQuiz/model/schema';
import { cn } from '@/shared/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  onlineSales: ShoppingCart,
  onlinePresence: Globe,
  bookings: CalendarCheck,
  leadGen: UserPlus,
  branding: Palette,
  automation: Cog,
  other: MoreHorizontal,
};

export default function Step2Goals() {
  const t = useTranslations('demoQuiz');
  const { goals, toggleGoal, setCustomGoal } = useDemoQuizStore();

  const selected = goals.preset;
  const isOther = !!goals.custom?.trim();

  return (
    <div className="space-y-6">
      <header className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t('step2.title')}
        </h2>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-md mx-auto">
          {t('step2.subtitle')}
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {GOAL_PRESETS.map((key, idx) => {
          const Icon = ICONS[key] ?? MoreHorizontal;
          const isSelected = selected.includes(key);
          return (
            <motion.button
              key={key}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
              onClick={() => {
                if (key === 'other') {
                  // Toggling "other" just reveals the custom input.
                  if (!isOther) setCustomGoal(' ');
                  else setCustomGoal('');
                } else {
                  toggleGoal(key);
                }
              }}
              className={cn(
                'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all',
                'min-h-[72px]',
                isSelected || (key === 'other' && isOther)
                  ? 'border-[var(--primary-color)] bg-[color-mix(in_srgb,var(--primary-color)_8%,transparent)] shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-color)]/50 hover:-translate-y-0.5'
              )}
            >
              <Icon
                className={cn(
                  'h-6 w-6 shrink-0',
                  isSelected || (key === 'other' && isOther)
                    ? 'text-[var(--primary-color)]'
                    : 'text-[var(--text-muted)]'
                )}
              />
              <span
                className={cn(
                  'text-sm font-semibold leading-tight',
                  isSelected || (key === 'other' && isOther)
                    ? 'text-[var(--primary-color)]'
                    : 'text-[var(--text)]'
                )}
              >
                {t(`step2.options.${key}`)}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom "Other" goal input */}
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
            {t('step2.otherPlaceholder')}
          </label>
          <input
            type="text"
            value={goals.custom ?? ''}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder={t('step2.otherPlaceholder')}
            className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-base focus:outline-none focus:border-[var(--primary-color)] transition-colors"
          />
        </div>
      </motion.div>
    </div>
  );
}
