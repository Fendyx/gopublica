'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';

export default function DashboardOverview() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { token, user } = useTenantAuthStore();

  useEffect(() => {
    if (!token) router.replace('/login-client');
  }, [token, router]);

  if (!token || !user) return null;

  const statusColor =
    user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing'
      ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
      : 'text-red-600 bg-red-100 dark:bg-red-900/30';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('overviewTitle', { name: user.name })}</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="text-[var(--text-muted)]">{t('email')}:</span> {user.email}</p>
            <p><span className="text-[var(--text-muted)]">{t('phone')}:</span> {user.phone || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('subscription')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="text-[var(--text-muted)]">{t('plan')}:</span>{' '}
              <span className="font-semibold capitalize">{user.subscriptionPlan}</span>
            </p>
            <p>
              <span className="text-[var(--text-muted)]">{t('status')}:</span>{' '}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {user.subscriptionStatus}
              </span>
            </p>
            {user.currentPeriodEnd && (
              <p>
                <span className="text-[var(--text-muted)]">{t('currentPeriodEnd')}:</span>{' '}
                {new Date(user.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}