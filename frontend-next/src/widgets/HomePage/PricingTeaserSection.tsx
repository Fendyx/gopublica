'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Check, Lock, Zap, ArrowRight } from 'lucide-react';

type PlanProps = { id: string; price: number; popular?: boolean };

type Props = {
  currency: string;
  plans: PlanProps[];
};

function formatPrice(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

const allFeatures = [
  'adminPanel',
  'booking',
  'gallery',
  'domainSsl',
  'onlineOrders',
  'location3',
  'prioritySupport',
  'advancedAnalytics',
  'locationUnlimited',
  'dedicatedManager',
  'whiteLabel',
  'customIntegrations',
] as const;

/* Which features each plan includes */
const planInclusions: Record<string, string[]> = {
  starter: ['adminPanel', 'booking', 'gallery', 'domainSsl'],
  growth: ['adminPanel', 'booking', 'gallery', 'domainSsl', 'onlineOrders', 'location3', 'prioritySupport', 'advancedAnalytics'],
  scale: allFeatures as unknown as string[],
};

export default function PricingTeaserSection({ currency, plans }: Props) {
  const t = useTranslations('home');
  const tp = useTranslations('pricing');

  return (
    <section className="py-24 px-6 bg-[var(--surface)] border-y border-[var(--border)]">
      <div className="max-w-5xl mx-auto text-center">
        {/* Header */}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-3">
          {tp('title')}
        </h2>
        <p className="text-lg text-[var(--text-muted)] max-w-xl mx-auto mb-12">
          {tp('subtitle')}
        </p>

        {/* Cards — horizontal on desktop, scroll on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const included = planInclusions[plan.id];
            return (
              <div
                key={plan.id}
                className={[
                  'relative flex flex-col rounded-xl text-left',
                  plan.popular
                    ? 'ring-2 ring-[var(--primary-color)] shadow-xl shadow-blue-500/10 bg-[var(--bg)] md:scale-[1.03] md:z-10'
                    : 'border border-[var(--border)] shadow-sm bg-[var(--bg)]',
                ].join(' ')}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center pointer-events-none z-20">
                    <span className="flex items-center gap-1 rounded-full bg-[var(--primary-color)] px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest shadow-md whitespace-nowrap">
                      <Zap size={9} className="shrink-0" />
                      {tp('badge')}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className={`px-5 pb-4 ${plan.popular ? 'pt-8' : 'pt-5'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary-color)] mb-0.5">
                    {tp(`plans.${plan.id}.tagline`)}
                  </p>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold text-[var(--text)]">
                      {tp(`plans.${plan.id}.name`)}
                    </h3>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="text-2xl font-extrabold text-[var(--text)] leading-none">
                        {formatPrice(plan.price, currency)}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{tp('period')}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4">
                  <Link href="/pricing">
                    <button
                      className={[
                        'w-full flex items-center justify-center gap-1.5',
                        'rounded-lg py-2.5 text-sm font-semibold',
                        'transition-all duration-200',
                        plan.popular
                          ? 'bg-[var(--primary-color)] text-white hover:opacity-90'
                          : 'border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]',
                      ].join(' ')}
                    >
                      {t('viewAllPlans')}
                      <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>

                <div className="mx-5 border-t border-[var(--border)]" />

                {/* Feature list */}
                <ul className="px-5 py-4 space-y-2 flex-1">
                  {allFeatures.map((key) => {
                    const isIncluded = included.includes(key);
                    return (
                      <li key={key} className="flex items-center gap-2">
                        {isIncluded ? (
                          <Check size={13} className="shrink-0 text-[var(--primary-color)]" />
                        ) : (
                          <Lock size={13} className="shrink-0 text-[var(--text-muted)] opacity-25" />
                        )}
                        <span
                          className={
                            'text-xs leading-snug ' +
                            (isIncluded ? 'text-[var(--text)]' : 'text-[var(--text-muted)] opacity-40')
                          }
                        >
                          {tp(`features.${key}`)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="pb-5" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
