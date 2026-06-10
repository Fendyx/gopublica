'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

type Plan = {
  id: string;
  name: string;
  price: string;
  priceId: string;
  popular?: boolean;
  features: string[];
};

type Props = {
  plans: Plan[];
  onSelect: (priceId: string) => void;
};

export default function PricingCards({ plans, onSelect }: Props) {
  const t = useTranslations('pricing');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`relative flex flex-col justify-between gap-8 rounded-2xl border p-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
            plan.popular
              ? 'border-[var(--primary-color)] bg-[var(--surface)] shadow-md'
              : 'border-[var(--border)] bg-[var(--bg)]'
          }`}
        >
          {plan.popular && (
            <span className="absolute -top-3 right-10 rounded-full bg-[var(--primary-color)] px-4 py-1 text-xs font-semibold text-white">
              {t('badge')}
            </span>
          )}
          <div>
            <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-extrabold">{plan.price}€</span>
              <span className="text-sm text-[var(--text-muted)]">{t('period')}</span>
              <span className="text-xs text-[var(--text-muted)] ml-1">{t('net')}</span>
            </div>
            <ul className="space-y-3">
              {plan.features.map((f, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[var(--text)]">
                  <Check size={16} className="text-[var(--primary-color)] mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button
            variant={plan.popular ? 'default' : 'outline'}
            className="w-full"
            onClick={() => onSelect(plan.priceId)}
          >
            {t('btnText')}
          </Button>
        </div>
      ))}
    </div>
  );
}