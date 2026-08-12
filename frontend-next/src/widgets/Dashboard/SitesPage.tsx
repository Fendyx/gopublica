'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { tenantApi } from '@/entities/subscription/api/tenantApi';
import type { Site, SiteStatus, SiteNiche, SiteType } from '@/entities/subscription/model/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import {
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe as GlobeIcon,
  Link as LinkIcon,
  Server,
  Building2,
  Utensils,
  Sparkles,
  Car,
  ShoppingBag,
  Plus,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const nicheIcons: Record<SiteNiche, React.ElementType> = {
  food: Utensils,
  restaurant: Utensils,
  beauty: Sparkles,
  auto: Car,
  ecommerce: ShoppingBag,
};

const nicheLabels: Record<SiteNiche, string> = {
  food: 'Food & Drink',
  restaurant: 'Restaurant',
  beauty: 'Beauty & Grooming',
  auto: 'Auto Services',
  ecommerce: 'E-commerce',
};

const typeLabels: Record<SiteType, string> = {
  primary: 'Primary Domain',
  subdomain: 'Subdomain',
  landing: 'Landing Page',
  microsite: 'Microsite',
};

const statusConfig: Record<SiteStatus, { label: string; color: string; icon: React.ElementType }> = {
  live: { label: 'Live', color: 'text-green-600 bg-green-100 dark:bg-green-900/30', icon: CheckCircle },
  staging: { label: 'Staging', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', icon: GlobeIcon },
  building: { label: 'Building', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', icon: Loader2 },
  error: { label: 'Error', color: 'text-red-600 bg-red-100 dark:bg-red-900/30', icon: AlertCircle },
  paused: { label: 'Paused', color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30', icon: Clock },
};

interface DeploymentLog {
  status: string;
  url?: string;
  error?: string;
  createdAt: string;
}

interface SiteCardProps {
  site: Site;
}

function StatusBadge({ status }: { status: SiteStatus }) {
  const config = statusConfig[status] || statusConfig.paused;
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.color)}>
      <Icon size={10} className="shrink-0" />
      {config.label}
    </span>
  );
}

function NicheBadge({ niche }: { niche: SiteNiche }) {
  const Icon = nicheIcons[niche] || GlobeIcon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)]">
      <Icon size={10} className="shrink-0" />
      {nicheLabels[niche] || niche}
    </span>
  );
}

function TypeBadge({ type }: { type: SiteType }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)]">
      <Building2 size={10} className="shrink-0" />
      {typeLabels[type] || type}
    </span>
  );
}

function DeploymentLogs({ logs }: { logs: DeploymentLog[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-6 text-[var(--text-muted)] text-sm">
        No deployment history yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-[var(--border)] pt-4 mt-4">
      <h4 className="text-sm font-semibold text-[var(--text)]">Deployment History</h4>
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <StatusBadge status={log.status as SiteStatus} />
                <time className="text-xs text-[var(--text-muted)]">
                  {new Date(log.createdAt).toLocaleString()}
                </time>
              </div>
              {log.url && (
                <a
                  href={log.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--primary-color)] hover:underline"
                >
                  <ExternalLink size={12} />
                  {log.url}
                </a>
              )}
              {log.error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{log.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SiteCard({ site }: SiteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('sites');

  const primaryUrl = site.liveUrl || site.stagingUrl;
  const hasUrl = !!primaryUrl;

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-[var(--text)] truncate">{site.name}</h3>
                <TypeBadge type={site.type} />
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <NicheBadge niche={site.niche} />
                <StatusBadge status={site.status} />
              </div>
              {site.domain && (
                <p className="text-sm text-[var(--text-muted)] truncate">
                  <GlobeIcon size={14} className="inline-block mr-1" />
                  {site.domain}
                </p>
              )}
              {site.subdomain && !site.domain && (
                <p className="text-sm text-[var(--text-muted)] truncate">
                  <LinkIcon size={14} className="inline-block mr-1" />
                  {site.subdomain}.gopublica.com
                </p>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-[var(--bg)] transition-colors text-[var(--text-muted)]"
              aria-label={isExpanded ? t('collapse') : t('expand')}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
            {hasUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(primaryUrl!, '_blank', 'noopener,noreferrer')}
                className="gap-1.5"
              >
                <ExternalLink size={14} />
                {site.liveUrl ? t('visitLive') : t('visitStaging')}
              </Button>
            )}
            {site.status === 'building' && (
              <Button variant="outline" size="sm" disabled className="text-[var(--text-muted)]">
                <Loader2 size={14} className="animate-spin" />
                {t('building')}
              </Button>
            )}
            {site.status === 'error' && (
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20">
                <AlertCircle size={14} />
                {t('viewError')}
              </Button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="px-6 pb-6">
            <DeploymentLogs logs={site.deploymentLogs || []} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-[var(--bg)] rounded w-3/4" />
                <div className="h-4 bg-[var(--bg)] rounded w-1/2" />
                <div className="h-4 bg-[var(--bg)] rounded w-1/3" />
                <div className="h-10 bg-[var(--bg)] rounded" />
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
        <Button
          onClick={() => router.push('/dashboard/sites/new')}
          className="gap-2"
        >
          <Plus size={18} />
          {t('addSite')}
        </Button>
      </div>

      {sites.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}