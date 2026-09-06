'use client';

import { useTranslations } from 'next-intl';
import type { CustomService } from '@/entities/customService/model/types';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-50 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400',
  },
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-gray-400',
};

interface SummaryStatsProps {
  services: CustomService[];
  loading: boolean;
}

export default function SummaryStats({ services, loading }: SummaryStatsProps) {
  const t = useTranslations('customServices');

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-[var(--surface)] animate-pulse" />
        ))}
      </div>
    );
  }

  const pending = services.filter((s) => s.status === 'pending');
  const inProgress = services.filter((s) => s.status === 'in_progress');
  const totalDue = pending.reduce((sum, s) => sum + s.price, 0);

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

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {t('stats.pending')}
        </p>
        <p className="mt-1 text-2xl font-bold text-[var(--text)]">{pending.length}</p>
      </div>
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {t('stats.inProgress')}
        </p>
        <p className="mt-1 text-2xl font-bold text-[var(--text)]">{inProgress.length}</p>
      </div>
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {t('stats.totalDue')}
        </p>
        <p className="mt-1 text-2xl font-bold text-[var(--text)]">
          {totalDue > 0 ? formatCurrency(totalDue, 'PLN') : '—'}
        </p>
      </div>
    </div>
  );
}
