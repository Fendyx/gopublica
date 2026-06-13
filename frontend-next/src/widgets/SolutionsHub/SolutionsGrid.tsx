'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { SolutionCard } from './SolutionCard';
import type { SolutionModule } from '@/content/solutions/types';

interface Props {
  solutions: SolutionModule[];
}

export function SolutionsGrid({ solutions }: Props) {
  return (
    <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {solutions.map((mod) => (
          <motion.div
            key={mod.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <SolutionCard module={mod} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}