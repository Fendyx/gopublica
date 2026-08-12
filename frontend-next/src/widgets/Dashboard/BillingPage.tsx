'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { tenantApi } from '@/entities/subscription/api/tenantApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { ArrowUpCircle, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';

// ─── Shared Pricing Logic ──────────
const PLAN_PRICES: Record<string, Record<string, number>> = {
  starter: { EUR: 29, PLN: 59, UAH: 399, USD: 39 },
  growth:  { EUR: 39, PLN: 79, UAH: 599, USD: 59 },
  pro:     { EUR: 39, PLN: 79, UAH: 599, USD: 59 }, // Fallback для старых юзеров с 'pro'
  scale:   { EUR: 89, PLN: 199, UAH: 1599, USD: 99 },
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
// ─────────────────────────────────────────────────────────────────────────────

// Принимаем ipCurrency напрямую от сервера, как в Pricing
export default function BillingPage({ ipCurrency = 'EUR' }: { ipCurrency?: string }) {
  const t = useTranslations('billing');
  const router = useRouter();
  const { user, login, token } = useTenantAuthStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  // Берем чисто IP-валюту, никаких primaryCurrency из базы!
  const userCurrency = ipCurrency; 
  const planName = (user.subscriptionPlan || 'starter').toLowerCase();
  const planPriceAmount = PLAN_PRICES[planName]?.[userCurrency] || 0;
  
  const isCanceled = user.subscriptionStatus === 'canceled';
  const isTopTier = ['growth', 'scale', 'pro'].includes(planName);

  const handleCancel = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await tenantApi.cancelSubscription();
      login(token!, { ...user, subscriptionStatus: updated.subscriptionStatus });
      setShowCancelModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">{t('title')}</h2>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('currentPlan')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold capitalize">{planName}</p>
              {/* <p className="text-sm text-[var(--text-muted)]">
                {planPriceAmount > 0 
                  ? `${formatCurrency(planPriceAmount, userCurrency)} / ${t('month', { fallback: 'month' })}`
                  : t('freePlan', { fallback: 'Free' })
                }
              </p> */}
            </div>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium w-fit ${
                isCanceled
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {user.subscriptionStatus}
              {isCanceled ? ` (${t('endsAtPeriodEnd', { fallback: 'ends at period end' })})` : ''}
            </span>
          </div>

          {!isTopTier && !isCanceled && (
            <Link href="/pricing" className="inline-block mt-4">
              <Button className="gap-2">
                <ArrowUpCircle size={18} />
                {t('upgradePlan', { fallback: 'Upgrade Plan' })}
              </Button>
            </Link>
          )}
          
          {isTopTier && !isCanceled && (
            <p className="text-sm text-[var(--text-muted)] pt-2">
              {t('proThanks', { fallback: 'Thank you for being a premium subscriber!' })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {!isCanceled && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              {t('dangerZone')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {t('cancelDescription')}
            </p>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20"
              onClick={() => setShowCancelModal(true)}
            >
              {t('cancelSubscription')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t('confirmCancel')}</h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1 hover:opacity-70 transition-opacity">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {t('cancelWarning')}
            </p>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                {t('keepPlan')}
              </Button>
              <Button
                variant="outline"
                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                onClick={handleCancel}
                disabled={loading}
              >
                {loading ? t('cancelling') : t('confirmCancelBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}