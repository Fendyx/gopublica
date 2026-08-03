// src/widgets/DemoQuiz/StepIndicator.tsx
'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface Props {
  current: 1 | 2 | 3;
}

export default function StepIndicator({ current }: Props) {
  const t = useTranslations('demoQuiz');
  const steps: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        {steps.map((s, idx) => {
          const isDone = s < current;
          const isActive = s === current;
          return (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    backgroundColor: isActive || isDone
                      ? 'var(--primary-color)'
                      : 'var(--surface)',
                    color: isActive || isDone ? '#ffffff' : 'var(--text-muted)',
                    borderColor: isActive || isDone
                      ? 'var(--primary-color)'
                      : 'var(--border)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={cn(
                    'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 text-sm font-bold'
                  )}
                >
                  {isDone ? '✓' : s}
                </motion.div>
              </div>
              {idx < steps.length - 1 && (
                <div className="relative mx-2 h-1 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                  <motion.div
                    initial={false}
                    animate={{ width: isDone ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 bg-[var(--primary-color)]"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs font-medium text-[var(--text-muted)]">
        {t('stepIndicator.step')} {current} {t('stepIndicator.of')} 3
      </p>
    </div>
  );
}
