'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { tenantApi } from '@/entities/subscription/api/tenantApi';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { ArrowUpCircle, Calendar, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// ─── Shared Pricing Logic ──────────
const PLAN_PRICES: Record<string, Record<string, number>> = {
  starter: { EUR: 29, PLN: 59, UAH: 399, USD: 39 },
  growth:  { EUR: 39, PLN: 79, UAH: 599, USD: 59 },
  pro:     { EUR: 39, PLN: 79, UAH: 599, USD: 59 },
  scale:   { EUR: 89, PLN: 199, UAH: 1599, USD: 99 },
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40',
  trialing:  'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
  canceled:  'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40',
  past_due:  'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40',
  inactive:  'bg-gray-50 text-gray-500 border border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700/40',
};

interface SubscriptionOverviewProps {
  ipCurrency?: string;
}

export default function SubscriptionOverview({ ipCurrency = 'EUR' }: SubscriptionOverviewProps) {
  const t = useTranslations('billing');
  const router = useRouter();
  const { user, login, token } = useTenantAuthStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const userCurrency = ipCurrency;
  const planName = (user.subscriptionPlan || 'starter').toLowerCase();
  const planPriceAmount = PLAN_PRICES[planName]?.[userCurrency] || 0;
  const isCanceled = user.subscriptionStatus === 'canceled';
  const isTopTier = ['growth', 'scale', 'pro'].includes(planName);

  const statusKey = isCanceled ? 'canceled' : user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing' ? user.subscriptionStatus : 'inactive';
  const statusLabel = isCanceled
    ? `${user.subscriptionStatus} - ${t('endsAtPeriodEnd')}`
    : user.subscriptionStatus;

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
    <>
      <Card premium hover>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Plan info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--primary-color)]/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[var(--primary-color)]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {t('currentPlan')}
                </p>
                <h3 className="text-2xl font-bold capitalize text-[var(--text)]">{planName}</h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[statusKey]}`}>
                {statusLabel}
              </span>

              {user.currentPeriodEnd && !isCanceled && (
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('nextBilling')}: {new Date(user.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Right: Price + CTA */}
          <div className="flex flex-col items-start lg:items-end gap-3">
            {planPriceAmount > 0 && (
              <div className="text-right">
                <span className="text-3xl font-bold text-[var(--text)]">
                  {formatCurrency(planPriceAmount, userCurrency)}
                </span>
                <span className="text-sm text-[var(--text-muted)] ml-1">{t('perMonth')}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {!isTopTier && !isCanceled && (
                <Link href="/pricing">
                  <Button className="gap-2 rounded-full px-5 h-10 text-sm font-medium">
                    <ArrowUpCircle size={16} />
                    {t('upgradePlan')}
                  </Button>
                </Link>
              )}

              {!isCanceled && (
                <Button
                  variant="outline"
                  className="rounded-full px-4 h-10 text-sm font-medium border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => setShowCancelModal(true)}
                >
                  {t('cancelSubscription')}
                </Button>
              )}
            </div>

            {isTopTier && !isCanceled && (
              <p className="text-xs text-[var(--text-muted)]">
                {t('proThanks')}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-2">{t('confirmCancel')}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {t('cancelWarning')}
            </p>
            {error && (
              <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-full px-5 h-10"
                onClick={() => setShowCancelModal(false)}
              >
                {t('keepPlan')}
              </Button>
              <Button
                className="rounded-full px-5 h-10 bg-red-600 text-white hover:bg-red-700 border-0"
                onClick={handleCancel}
                disabled={loading}
              >
                {loading ? t('cancelling') : t('confirmCancelBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
