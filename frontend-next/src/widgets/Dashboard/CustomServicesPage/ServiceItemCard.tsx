'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import type { CustomService } from '@/entities/customService/model/types';
import StatusBadge from './StatusBadge';

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

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  high: { color: 'bg-red-500', label: 'High' },
  medium: { color: 'bg-amber-400', label: 'Medium' },
  low: { color: 'bg-gray-400', label: 'Low' },
};

interface ServiceItemCardProps {
  service: CustomService;
  onPay: (service: CustomService) => void;
}

export default function ServiceItemCard({ service, onPay }: ServiceItemCardProps) {
  const t = useTranslations('customServices');
  const priority = PRIORITY_CONFIG[service.priority] || PRIORITY_CONFIG.medium;
  const canPay = service.status === 'pending' && service.price > 0;

  return (
    <Card premium hover className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {service.title}
          </h3>
          {service.description && (
            <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-2">
              {service.description}
            </p>
          )}
        </div>
        <StatusBadge status={service.status} />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
        {/* Priority dot */}
        <span className="inline-flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${priority.color}`} />
          {priority.label}
        </span>

        {/* Price */}
        {service.price > 0 && (
          <span className="font-semibold text-[var(--text)]">
            {formatCurrency(service.price, service.currency.toUpperCase())}
          </span>
        )}
        {service.price === 0 && (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {t('includedInSubscription')}
          </span>
        )}

        {/* Created date */}
        <span className="ml-auto">
          {t('created')}: {new Date(service.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Action row */}
      {canPay && (
        <Button
          onClick={() => onPay(service)}
          className="w-full gap-2 rounded-xl"
        >
          <CreditCard size={16} />
          {t('payNow')} - {formatCurrency(service.price, service.currency.toUpperCase())}
        </Button>
      )}

      {service.status === 'in_progress' && service.paidAt && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <CheckCircle size={14} className="text-emerald-500" />
          {t('paid')} {new Date(service.paidAt).toLocaleDateString()}
        </div>
      )}

      {service.status === 'completed' && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle size={14} />
          {t('status.completed')}
        </div>
      )}
    </Card>
  );
}
