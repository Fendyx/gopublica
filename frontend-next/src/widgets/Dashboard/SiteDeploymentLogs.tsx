'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { SiteStatus } from '@/entities/subscription/model/types';
import { SiteStatusBadge } from './SiteStatusBadge';

export interface DeploymentLog {
  status: string;
  url?: string;
  error?: string;
  createdAt: string;
}

interface SiteDeploymentLogsProps {
  logs: DeploymentLog[];
}

export function SiteDeploymentLogs({ logs }: SiteDeploymentLogsProps) {
  const t = useTranslations('sites');

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-6 text-[var(--text-muted)] text-sm">
        {t('noDeploymentHistory')}
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-[var(--border)] pt-4 mt-4">
      <h4 className="text-sm font-semibold text-[var(--text)]">
        {t('deploymentHistory')}
      </h4>
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <SiteStatusBadge status={log.status as SiteStatus} />
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {log.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
