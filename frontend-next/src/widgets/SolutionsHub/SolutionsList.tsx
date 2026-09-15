'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { SolutionRow } from './SolutionRow';
import type { SolutionModule } from '@/content/solutions/types';

interface Props {
  solutions: SolutionModule[];
}

/**
 * Списочный layout (List View) для модулей Solutions.
 * Одна колонка на мобильных, две на больших экранах —
 * компактно и легко сканируется взглядом.
 */
export function SolutionsList({ solutions }: Props) {
  return (
    <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      <AnimatePresence mode="popLayout">
        {solutions.map((mod) => (
          <motion.div
            key={mod.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <SolutionRow module={mod} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
