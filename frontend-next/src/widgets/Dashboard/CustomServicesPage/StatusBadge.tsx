'use client';

import { useTranslations } from 'next-intl';

const STATUS_CONFIG: Record<string, { labelKey: string; className: string }> = {
  pending: {
    labelKey: 'status.pending',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  in_progress: {
    labelKey: 'status.inProgress',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  completed: {
    labelKey: 'status.completed',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  cancelled: {
    labelKey: 'status.cancelled',
    className: 'bg-gray-50 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400',
  },
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('customServices');
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      {t(config.labelKey)}
    </span>
  );
}
