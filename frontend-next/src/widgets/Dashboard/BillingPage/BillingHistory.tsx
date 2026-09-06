'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/shared/ui/Card';
import { ExternalLink, ReceiptText } from 'lucide-react';
import type { Invoice } from '@/entities/subscription/model/types';

// ─── Shared Pricing Logic (mirror from SubscriptionOverview) ──────────
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
// ──────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  },
  open: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  void: {
    label: 'Void',
    className: 'bg-gray-50 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400',
  },
  uncollectible: {
    label: 'Uncollectible',
    className: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  },
};

interface BillingHistoryProps {
  invoices: Invoice[];
  currency?: string;
}

export default function BillingHistory({ invoices, currency = 'EUR' }: BillingHistoryProps) {
  const t = useTranslations('billing');

  return (
    <Card premium>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--bg)] flex items-center justify-center">
            <ReceiptText className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">{t('billingHistory')}</h3>
            <p className="text-xs text-[var(--text-muted)]">
              {invoices.length > 0
                ? `${invoices.length} ${invoices.length === 1 ? 'invoice' : 'invoices'}`
                : t('noInvoices')}
            </p>
          </div>
        </div>

        {/* Invoices list */}
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg)] flex items-center justify-center mb-3">
              <ReceiptText className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">{t('noInvoices')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              <span>{t('invoiceDate')}</span>
              <span className="text-right">{t('invoiceAmount')}</span>
              <span className="text-right">{t('invoiceStatus')}</span>
              <span className="w-8" />
            </div>

            {/* Invoice rows */}
            {invoices.map((invoice) => {
              const status = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.open;
              const date = new Date(invoice.date);

              return (
                <div
                  key={invoice.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 rounded-2xl hover:bg-[var(--bg)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">
                      {invoice.description || t('subscription')}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-[var(--text)] tabular-nums whitespace-nowrap">
                    {formatCurrency(invoice.amount / 100, invoice.currency.toUpperCase())}
                  </p>

                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.className}`}>
                    {status.label}
                  </span>

                  <div className="w-8 flex justify-end">
                    {(invoice.hostedUrl || invoice.pdfUrl) && (
                      <a
                        href={invoice.hostedUrl || invoice.pdfUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary-color)] hover:bg-[var(--primary-color)]/10 transition-colors"
                        title={t('viewReceipt')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
