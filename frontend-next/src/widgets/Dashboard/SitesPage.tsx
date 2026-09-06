'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { tenantApi } from '@/entities/subscription/api/tenantApi';
import type { Site } from '@/entities/subscription/model/types';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Globe, AlertCircle, Plus } from 'lucide-react';
import { SiteCard } from './SiteCard';

function EmptyState() {
  const t = useTranslations('sites');
  const router = useRouter();

  const handleCreateSite = () => {
    router.push('/dashboard/sites/new');
  };

  return (
    <Card className="border-2 border-dashed border-[var(--border)] bg-[var(--surface)]">
      <CardContent className="py-16 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-[var(--primary-color)]/10 flex items-center justify-center mb-6">
          <Globe size={40} className="text-[var(--primary-color)]" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('emptyTitle')}</h3>
        <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
          {t('emptyDesc')}
        </p>
        <Button onClick={handleCreateSite} size="lg" className="gap-2">
          <Plus size={18} />
          {t('createFirstSite')}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function SitesPage() {
  const t = useTranslations('sites');
  const router = useRouter();
  const { token, user } = useTenantAuthStore();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/login-client');
      return;
    }

    const fetchSites = async () => {
      try {
        setIsLoading(true);
        const data = await tenantApi.getSites();
        setSites(data.sites || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sites');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSites();
  }, [token, router]);

  if (!token || !user) return null;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('title')}</h2>
        </div>
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <CardContent className="p-0 flex flex-col md:flex-row">
                <div className="md:w-[45%] h-48 md:h-auto md:min-h-[240px] bg-[var(--bg)]" />
                <div className="flex-1 p-5 space-y-3">
                  <div className="flex gap-1.5">
                    <div className="h-5 w-14 bg-[var(--bg)] rounded-full" />
                    <div className="h-5 w-16 bg-[var(--bg)] rounded-full" />
                    <div className="h-5 w-12 bg-[var(--bg)] rounded-full" />
                  </div>
                  <div className="h-5 bg-[var(--bg)] rounded w-3/4" />
                  <div className="h-4 bg-[var(--bg)] rounded w-1/2" />
                  <div className="h-9 bg-[var(--bg)] rounded w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('title')}</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('errorTitle')}</h3>
            <p className="text-[var(--text-muted)] mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>{t('retry')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('title')}</h2>
        {/* <Button
          onClick={() => router.push('/dashboard/sites/new')}
          className="gap-2"
        >
          <Plus size={18} />
          {t('addSite')}
        </Button> */}
      </div>

      {sites.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-6">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}