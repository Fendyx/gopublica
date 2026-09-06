'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { tenantApi } from '@/entities/subscription/api/tenantApi';
import type { PaymentMethod, Invoice } from '@/entities/subscription/model/types';
import SubscriptionOverview from './BillingPage/SubscriptionOverview';
import PaymentMethodCard from './BillingPage/PaymentMethodCard';
import BillingHistory from './BillingPage/BillingHistory';

export default function BillingPage({ ipCurrency = 'EUR' }: { ipCurrency?: string }) {
  const t = useTranslations('billing');
  const { user } = useTenantAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [pm, inv] = await Promise.allSettled([
          tenantApi.getPaymentMethod(),
          tenantApi.getInvoices(),
        ]);

        if (pm.status === 'fulfilled') setPaymentMethod(pm.value);
        if (inv.status === 'fulfilled') setInvoices(inv.value.invoices || []);
      } catch {
        // Silently fail — components handle empty states
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {t('subtitle')}
        </p>
      </div>

      {/* Subscription Overview */}
      <section>
        <SubscriptionOverview ipCurrency={ipCurrency} />
      </section>

      {/* Payment Method */}
      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">
          {t('paymentMethod')}
        </h2>
        <PaymentMethodCard
          paymentMethod={loadingData ? null : paymentMethod}
          userName={user.name}
        />
      </section>

      {/* Billing History */}
      <section>
        <BillingHistory
          invoices={loadingData ? [] : invoices}
          currency={ipCurrency}
        />
      </section>
    </div>
  );
}