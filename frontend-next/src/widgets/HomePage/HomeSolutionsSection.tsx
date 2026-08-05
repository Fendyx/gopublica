'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const solutions = [
  {
    key: 'food',
    href: '/agency-food',
    mediaType: 'video',
    mediaSrc: '/videos/food-demo.mp4',
  },
  {
    key: 'grooming',
    href: '/agency-beauty-grooming',
    mediaType: 'video',
    mediaSrc: '/videos/grooming-demo.mp4',
  },
  {
    key: 'salon',
    href: '/agency-beauty-salon',
    mediaType: 'video',
    mediaSrc: '/videos/beautysalon-demo.mp4',
  },
  {
    key: 'other',
    href: '/agency-other',
    mediaType: 'image',
    mediaSrc:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
  },
];

function SolutionCard({
  href,
  mediaType,
  mediaSrc,
  title,
  desc,
}: {
  href: string;
  mediaType: string;
  mediaSrc: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-3xl aspect-[4/3] lg:aspect-[16/10] bg-[var(--bg)] border border-[var(--border)] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className="absolute inset-0 w-full h-full">
        {mediaType === 'video' ? (
          <video
            src={mediaSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <img
            src={mediaSrc}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <h3 className="font-semibold text-2xl md:text-3xl text-white mb-3">
            {title}
          </h3>
          <p className="text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-3">
            {desc}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function HomeSolutionsSection() {
  const t = useTranslations('home');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
    }
  };

  const handlePrev = () => scrollToIndex(Math.max(activeIndex - 1, 0));
  const handleNext = () =>
    scrollToIndex(Math.min(activeIndex + 1, solutions.length - 1));

  // Отслеживаем какая карточка сейчас в центре видимости, чтобы подсвечивать точки
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
    <section className="py-24 px-6 bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
          {t('solutionsTitle')}
        </h2>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-lg">
          {t('solutionsSubtitle')}
        </p>
      </div>

      {/* Десктоп: обычная сетка */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {solutions.map(({ key, href, mediaType, mediaSrc }) => (
          <SolutionCard
            key={key}
            href={href}
            mediaType={mediaType}
            mediaSrc={mediaSrc}
            title={t(`solutions.${key}.title`)}
            desc={t(`solutions.${key}.desc`)}
          />
        ))}
      </div>

      {/* Мобилка: карусель со свайпом + стрелки + точки */}
      <div className="md:hidden relative -mx-6">
        <div
          ref={scrollerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide px-6 gap-4 pb-2"
          style={{ scrollPaddingLeft: '1.5rem' }}
        >
          {solutions.map(({ key, href, mediaType, mediaSrc }) => (
            <div
              key={key}
              className="snap-start shrink-0 w-[85%]"
            >
              <SolutionCard
                href={href}
                mediaType={mediaType}
                mediaSrc={mediaSrc}
                title={t(`solutions.${key}.title`)}
                desc={t(`solutions.${key}.desc`)}
              />
            </div>
          ))}
        </div>

        {/* Стрелки поверх карусели, чтобы явно намекнуть что можно листать */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-0 transition-opacity"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={activeIndex === solutions.length - 1}
          aria-label="Next"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-0 transition-opacity"
        >
          <ChevronRight size={18} />
        </button>

        {/* Точки-индикатор */}
        <div className="flex justify-center gap-2 mt-4">
          {solutions.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-6 bg-[var(--primary-color)]'
                  : 'w-1.5 bg-[var(--text-muted)]/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}