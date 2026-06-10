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

export default function BillingPage() {
  const t = useTranslations('billing');
  const router = useRouter();
  const { user, login, token } = useTenantAuthStore();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const isPro = user.subscriptionPlan === 'pro';
  const isCanceled = user.subscriptionStatus === 'canceled';

  const handleCancel = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await tenantApi.cancelSubscription();
      login(token!, { ...user, subscriptionStatus: updated.subscriptionStatus });
      setShowCancelModal(false);
      router.refresh(); // если нужно обновить серверные данные
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold capitalize">{user.subscriptionPlan}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {user.subscriptionPlan === 'pro' ? '€69/month' : '€39/month'}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isCanceled
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {user.subscriptionStatus}
              {isCanceled ? ' (ends at period end)' : ''}
            </span>
          </div>

          {!isPro && !isCanceled && (
            <Link href="/pricing">
              <Button className="gap-2">
                <ArrowUpCircle size={18} />
                {t('upgradeToPro')}
              </Button>
            </Link>
          )}
          {isPro && (
            <p className="text-sm text-[var(--text-muted)]">
              {t('proThanks')}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t('confirmCancel')}</h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1">
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
            <div className="flex justify-end gap-3">
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