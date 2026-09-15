'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, Utensils, Scissors, Wrench, Globe, ArrowRight } from 'lucide-react';
import { solutions as allSolutions, categories } from '@/content/solutions/modules';

/* ── Category data ────────────────────────────────────────────────────────── */

const categoryMeta: Record<
  string,
  { icon: typeof Utensils; imageSrc: string; gradient: string }
> = {
  food: {
    icon: Utensils,
    imageSrc: 'https://images.unsplash.com/photo-1622115837997-90c89ae689f9?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    gradient: 'from-orange-500/80 to-red-500/80',
  },
  beauty: {
    icon: Scissors,
    imageSrc: 'https://images.unsplash.com/photo-1633681926035-ec1ac984418a?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    gradient: 'from-pink-500/80 to-purple-500/80',
  },
  auto: {
    icon: Wrench,
    imageSrc: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    gradient: 'from-blue-500/80 to-cyan-500/80',
  },
  universal: {
    icon: Globe,
    imageSrc: '',
    gradient: 'from-slate-600/80 to-slate-800/80',
  },
};

/* ── CategoryCard ─────────────────────────────────────────────────────────── */

function CategoryCard({
  catId,
  index,
}: {
  catId: string;
  index: number;
}) {
  const t = useTranslations('solutions');
  const meta = categoryMeta[catId];
  const Icon = meta.icon;
  const modules = allSolutions.filter((m) => m.category === catId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href="/solutions"
        className="group relative block overflow-hidden rounded-2xl aspect-[4/3] bg-[var(--bg)] border border-[var(--border)] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
      >
        {/* Media background */}
        <div className="absolute inset-0 w-full h-full">
          {meta.imageSrc ? (
            <img
              src={meta.imageSrc}
              alt={t(`categories.${catId}`)}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${meta.gradient}`} />
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-75 group-hover:opacity-90 transition-opacity duration-500" />

        {/* Content */}
        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
          {/* Top: icon + badge */}
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Icon size={20} className="text-white" />
            </div>
            <span className="text-xs font-medium text-white/70 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
              {modules.length} {modules.length === 1 ? 'module' : 'modules'}
            </span>
          </div>

          {/* Bottom: title + modules list + CTA */}
          <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <h3 className="font-bold text-xl md:text-2xl text-white mb-2">
              {t(`categories.${catId}`)}
            </h3>
            <p className="text-sm text-gray-200/80 line-clamp-2 mb-3">
              {modules.map((m) => t(`modules.${m.id}.title`)).join(' · ')}
            </p>
            <div className="flex items-center gap-1.5 text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-400 delay-100">
              <span>{t('card.learnMore')}</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Mobile Category Card (simpler, for carousel) ────────────────────────── */

function MobileCategoryCard({ catId }: { catId: string }) {
  const t = useTranslations('solutions');
  const meta = categoryMeta[catId];
  const Icon = meta.icon;
  const modules = allSolutions.filter((m) => m.category === catId);

  return (
    <Link
      href="/solutions"
      className="group relative block overflow-hidden rounded-2xl aspect-[4/3] bg-[var(--bg)] border border-[var(--border)] transition-all duration-500 hover:-translate-y-1 hover:shadow-xl snap-start shrink-0 w-[85%]"
    >
      <div className="absolute inset-0 w-full h-full">
        {meta.imageSrc ? (
          <img
            src={meta.imageSrc}
            alt={t(`categories.${catId}`)}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${meta.gradient}`} />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-75" />
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white mb-1">
            {t(`categories.${catId}`)}
          </h3>
          <p className="text-xs text-gray-200/80 line-clamp-1">
            {modules.length} modules
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ── Main Section ─────────────────────────────────────────────────────────── */

export default function HomeSolutionsSection() {
  const tHome = useTranslations('home');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [activeIndex, setActiveIndex] = useState(0);

  const displayCategories = categories.filter((c) => c.id !== 'all');

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollLeft = el.scrollLeft;
      const children = Array.from(el.children) as HTMLElement[];
      let closestIndex = 0;
      let closestDistance = Infinity;
      children.forEach((child, i) => {
        const distance = Math.abs(child.offsetLeft - el.offsetLeft - scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      });
      setActiveIndex(closestIndex);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6 bg-[var(--surface)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-6xl mx-auto text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
          {tHome('solutionsTitle')}
        </h2>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-lg">
          {tHome('solutionsSubtitle')}
        </p>
      </motion.div>

      {/* Desktop: 4-column grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
        {displayCategories.map((cat, i) => (
          <CategoryCard key={cat.id} catId={cat.id} index={i} />
        ))}
      </div>

      {/* Mobile: horizontal carousel */}
      <div className="md:hidden relative -mx-6">
        <div
          ref={scrollerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide px-6 gap-4 pb-2"
          style={{ scrollPaddingLeft: '1.5rem' }}
        >
          {displayCategories.map((cat) => (
            <MobileCategoryCard key={cat.id} catId={cat.id} />
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={() => scrollToIndex(Math.max(activeIndex - 1, 0))}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--surface)]/90 backdrop-blur border border-[var(--border)] shadow-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => scrollToIndex(Math.min(activeIndex + 1, displayCategories.length - 1))}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--surface)]/90 backdrop-blur border border-[var(--border)] shadow-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {displayCategories.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'bg-[var(--primary-color)] w-5'
                  : 'bg-[var(--text-muted)]/30'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}