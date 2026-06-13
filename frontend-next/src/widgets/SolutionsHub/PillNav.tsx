'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils';

interface Category {
  id: string;
}

interface PillNavProps {
  categories: Category[];
  active: string;
  onChange: (id: string) => void;
  labelFn: (cat: Category) => string;
}

export function PillNav({ categories, active, onChange, labelFn }: PillNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-cat="${active}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [active]);

  return (
    <div className="sticky top-16 z-30 bg-base/90 backdrop-blur-md border-b border-border -mx-4 sm:mx-0">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            data-cat={cat.id}
            onClick={() => onChange(cat.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 border border-transparent',
              active === cat.id
                // 👇 Активное состояние: твой синий бренд-цвет
                ? 'bg-brand text-white shadow-lg'
                // 👇 Неактивное: используем твои переменные surface и muted. Dark mode отработает автоматически!
                : 'bg-surface text-body-muted hover:bg-secondary hover:text-body border-border'
            )}
          >
            {labelFn(cat)}
          </button>
        ))}
      </div>
    </div>
  );
}