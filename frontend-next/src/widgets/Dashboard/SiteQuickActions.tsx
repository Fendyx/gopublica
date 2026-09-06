'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import type { Site } from '@/entities/subscription/model/types';

interface SiteQuickActionsProps {
  site: Site;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function SiteQuickActions({
  site,
  isExpanded,
  onToggleExpand,
}: SiteQuickActionsProps) {
  const t = useTranslations('sites');

  const primaryUrl = site.liveUrl || site.stagingUrl;
  const hasUrl = !!primaryUrl;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.open(primaryUrl!, '_blank', 'noopener,noreferrer')
          }
          className="gap-1.5"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">
            {site.liveUrl ? t('visitLive') : t('visitStaging')}
          </span>
          <span className="sm:hidden">
            {site.liveUrl ? t('visitLiveShort') : t('visitStagingShort')}
          </span>
        </Button>
      )}

      {site.status === 'building' && (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="text-[var(--text-muted)]"
        >
          <ExternalLink size={14} className="animate-pulse" />
          {t('building')}
        </Button>
      )}

      {site.status === 'error' && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <AlertCircle size={14} />
          {t('viewError')}
        </Button>
      )}

      <button
        onClick={onToggleExpand}
        className="ml-auto p-1.5 rounded-lg hover:bg-[var(--bg)] transition-colors text-[var(--text-muted)]"
        aria-label={isExpanded ? t('collapse') : t('expand')}
      >
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
    </div>
  );
}
