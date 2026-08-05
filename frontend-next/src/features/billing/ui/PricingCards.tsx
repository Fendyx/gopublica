'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { Check, Lock, Zap, ArrowRight } from 'lucide-react';
import type { Plan } from '@/app/[locale]/pricing/page';

type Props = {
  plans: Plan[];
  currency: string;
  onSelect: (priceId: string) => void;
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

export default function PricingCards({ plans, currency, onSelect }: Props) {
  const t = useTranslations('pricing');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || window.innerWidth >= 768) return;
    const popularIndex = plans.findIndex((p) => p.popular);
    if (popularIndex < 0) return;
    const cards = container.querySelectorAll<HTMLElement>('[data-card]');
    const target = cards[popularIndex];
    if (!target) return;
    container.scrollLeft =
      target.offsetLeft - (container.offsetWidth - target.offsetWidth) / 2;
  }, [plans]);

  return (
    <>
      <div
        ref={scrollRef}
        className={[
          'flex gap-3 overflow-x-auto overflow-y-visible pb-2 pt-4',
          'snap-x snap-mandatory',
          '-mx-6 px-6 -mt-4',
          'md:grid md:grid-cols-3 md:gap-5',
          'md:overflow-visible md:pb-0',
          'md:mx-0 md:px-0 md:mt-0',
          'md:max-w-4xl md:mx-auto',
          'md:items-stretch',
        ].join(' ')}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {plans.map((plan) => {
          const isPopular = !!plan.popular;

          return (
            <div
              key={plan.id}
              data-card
              className={[
                'relative flex flex-col flex-shrink-0',
                'w-[82vw] md:w-auto',
                'snap-center',
                'rounded-xl',
                isPopular
                  ? 'ring-2 ring-[var(--primary-color)] shadow-xl shadow-blue-500/10 bg-[var(--surface)] md:scale-[1.03] md:z-10'
                  : 'border border-[var(--border)] shadow-sm bg-[var(--surface)]',
              ].join(' ')}
            >
              {isPopular && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center pointer-events-none z-20">
                  <span className="flex items-center gap-1 rounded-full bg-[var(--primary-color)] px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest shadow-md whitespace-nowrap">
                    <Zap size={9} className="shrink-0" />
                    {t('badge')}
                  </span>
                </div>
              )}

              <div className={`px-5 pb-4 ${isPopular ? 'pt-8' : 'pt-5'}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary-color)] mb-0.5">
                  {plan.tagline}
                </p>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold text-[var(--text)]">{plan.name}</h2>
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className="text-2xl font-extrabold text-[var(--text)] leading-none">
                      {formatCurrency(plan.price, currency)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{t('period')}</span>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] text-right">{t('net')}</p>
              </div>

              <div className="px-5 pb-4">
                <button
                  onClick={() => onSelect(plan.priceId)}
                  className={[
                    'w-full flex items-center justify-center gap-1.5',
                    'rounded-lg py-2.5 text-sm font-semibold',
                    'transition-all duration-200',
                    isPopular
                      ? 'bg-[var(--primary-color)] text-white hover:opacity-90'
                      : 'border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]',
                  ].join(' ')}
                >
                  {t('btnText')}
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="mx-5 border-t border-[var(--border)]" />

              <ul className="px-5 py-4 space-y-2 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check size={13} className="shrink-0 text-[var(--primary-color)]" />
                    ) : (
                      <Lock size={13} className="shrink-0 text-[var(--text-muted)] opacity-25" />
                    )}
                    <span
                      className={[
                        'text-xs leading-snug',
                        feature.included
                          ? 'text-[var(--text)]'
                          : 'text-[var(--text-muted)] opacity-40',
                      ].join(' ')}
                    >
                      {feature.text}
                      {feature.hot && feature.included && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-[var(--primary-color)]/10 text-[var(--primary-color)] px-1.5 py-0.5 text-[9px] font-bold uppercase">
                          <Zap size={8} />
                          key
                        </span>
                      )}
                      {feature.hot && !feature.included && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-[var(--border)] text-[var(--text-muted)] px-1.5 py-0.5 text-[9px] font-bold uppercase opacity-60">
                          <Lock size={8} />
                          {t('upgradeToUnlock')}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="pb-5" />
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-2 mt-4 md:hidden">
        {plans.map((plan) => (
          <span
            key={plan.id}
            className={[
              'block rounded-full transition-all',
              plan.popular
                ? 'w-5 h-1.5 bg-[var(--primary-color)]'
                : 'w-1.5 h-1.5 bg-[var(--border)]',
            ].join(' ')}
          />
        ))}
      </div>
    </>
  );
}