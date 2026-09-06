'use client';

import {
  Globe as GlobeIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { SiteStatus } from '@/entities/subscription/model/types';

const statusConfig: Record<
  SiteStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  live: {
    label: 'Live',
    color: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    icon: CheckCircle,
  },
  staging: {
    label: 'Staging',
    color: 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    icon: GlobeIcon,
  },
  building: {
    label: 'Building',
    color:
      'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
    icon: Loader2,
  },
  error: {
    label: 'Error',
    color: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    icon: AlertCircle,
  },
  paused: {
    label: 'Paused',
    color: 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30',
    icon: Clock,
  },
};

interface SiteStatusBadgeProps {
  status: SiteStatus;
  /** Show the animated pulsing dot for "live" status */
  showPulse?: boolean;
}

export function SiteStatusBadge({
  status,
  showPulse = false,
}: SiteStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.paused;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.color
      )}
    >
      {showPulse && status === 'live' && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
      )}
      {status !== 'live' && (
        <Icon
          size={10}
          className={cn(
            'shrink-0',
            status === 'building' && 'animate-spin'
          )}
        />
      )}
      {config.label}
    </span>
  );
}
