'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { solutions, categories } from '@/content/solutions/modules';
import { PillNav } from './PillNav';
import { SolutionsGrid } from './SolutionsGrid';

export function SolutionsHub() {
  const t = useTranslations('solutions');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredSolutions = useMemo(() => {
    if (activeCategory === 'all') return solutions;
    if (activeCategory === 'universal') return solutions.filter(m => m.category === 'universal');
    // для конкретной ниши показываем модули этой ниши + универсальные
    return solutions.filter(
      m => m.category === activeCategory || m.category === 'universal'
    );
  }, [activeCategory]);

  return (
    <div>
      <PillNav
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
        labelFn={(cat) => t(`categories.${cat.id}`)}
      />
      <SolutionsGrid solutions={filteredSolutions} />
    </div>
  );
}