'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/shared/ui/Card';
import { CreditCard, Plus, Settings } from 'lucide-react';
import type { PaymentMethod } from '@/entities/subscription/model/types';
import AddPaymentMethodModal from './AddPaymentMethodModal';

// ─── Inline SVG Card Brand Logos ──────────
function VisaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="white" fillOpacity="0.15" />
      <path
        d="M19.5 21.5h-3.2l2-11.5h3.2l-2 11.5zm10.8-11.2c-.6-.3-1.6-.5-2.8-.5-3.1 0-5.3 1.6-5.3 3.9 0 1.7 1.6 2.6 2.7 3.2 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.3 0-2-.2-3-.7l-.4-.2-.5 2.8c.7.3 2 .6 3.3.6 3.3 0 5.4-1.6 5.4-4 0-1.4-.8-2.4-2.6-3.3l-.1-.1-.4-.2zm4.3-3.3h-2.5c-.8 0-1.4.2-1.7 1l-4.8 10.5h3.4l.7-1.9h4.1l.4 1.9H37l-2.4-11.5zm-4 7.4l1.6-4.4.9 4.4h-2.5zm8.5-7.4l-3.3 8.2-.3-1.7c-.6-2-2.5-4.2-4.6-5.3l2.9 10h3.5l5.2-11.2h-3.4z"
        fill="currentColor"
      />
    </svg>
  );
}

function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="white" fillOpacity="0.15" />
      <circle cx="19" cy="16" r="8" fill="#EB001B" fillOpacity="0.9" />
      <circle cx="29" cy="16" r="8" fill="#F79E1B" fillOpacity="0.9" />
      <path
        d="M24 10.3a8 8 0 010 11.4 8 8 0 000-11.4z"
        fill="#FF5F00"
        fillOpacity="0.9"
      />
    </svg>
  );
}

function DefaultCardLogo({ className }: { className?: string }) {
  return (
    <CreditCard className={className} />
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function getBrandLogo(brand: string | null) {
  switch (brand) {
    case 'visa': return <VisaLogo className="h-8 w-auto" />;
    case 'mastercard': return <MastercardLogo className="h-8 w-auto" />;
    default: return <DefaultCardLogo className="w-8 h-8 text-[var(--text-muted)]" />;
  }
}

function getBrandColor(brand: string | null) {
  switch (brand) {
    case 'visa': return 'from-blue-600/8 via-blue-500/4 to-transparent dark:from-blue-500/10 dark:via-blue-400/5';
    case 'mastercard': return 'from-orange-500/8 via-red-500/4 to-transparent dark:from-orange-500/10 dark:via-red-400/5';
    default: return 'from-gray-500/8 via-gray-400/4 to-transparent dark:from-gray-500/10 dark:via-gray-400/5';
  }
}

function maskCardNumber(last4: string) {
  return `••••  ••••  ••••  ${last4}`;
}

function formatExpiry(expMonth: number | null, expYear: number | null) {
  if (!expMonth || !expYear) return null;
  const month = String(expMonth).padStart(2, '0');
  const year = String(expYear).slice(-2);
  return `${month}/${year}`;
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod | null;
  userName: string;
  onPaymentMethodUpdated?: (pm?: PaymentMethod) => void;
}

export default function PaymentMethodCard({ paymentMethod, userName, onPaymentMethodUpdated }: PaymentMethodCardProps) {
  const t = useTranslations('billing');
  const [showModal, setShowModal] = useState(false);
  const brand = paymentMethod?.brand ?? null;
  const last4 = paymentMethod?.last4 ?? null;
  const expiry = formatExpiry(paymentMethod?.expMonth ?? null, paymentMethod?.expYear ?? null);
  const cardholderName = paymentMethod?.cardholderName || userName;

  const handleSuccess = (pm: PaymentMethod) => {
    setShowModal(false);
    onPaymentMethodUpdated?.(pm);
  };

  if (!last4) {
    return (
      <>
        <Card premium className="border-dashed">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg)] flex items-center justify-center mb-4">
              <CreditCard className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text)] mb-1">
              {t('noPaymentMethod')}
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {t('addPaymentMethodDesc')}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[var(--primary-color)] text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              {t('addPaymentMethod')}
            </button>
          </div>
        </Card>
        {showModal && (
          <AddPaymentMethodModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
        )}
      </>
    );
  }

  return (
    <Card premium hover className={`relative overflow-hidden bg-gradient-to-br ${getBrandColor(brand)} border-[var(--border)]`}>
      {/* Brand logo — top right */}
      <div className="absolute top-6 right-8">
        {getBrandLogo(brand)}
      </div>

      <div className="space-y-6">
        {/* Label */}
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {t('paymentMethod')}
        </p>

        {/* Card number */}
        <p className="font-mono text-xl tracking-[0.2em] text-[var(--text)] font-medium">
          {maskCardNumber(last4)}
        </p>

        {/* Bottom row: name + expiry */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
              {t('cardholderName')}
            </p>
            <p className="text-sm font-medium text-[var(--text)] truncate max-w-[180px]">
              {cardholderName}
            </p>
          </div>

          <div className="flex items-end gap-4">
            {expiry && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                  {t('expires')}
                </p>
                <p className="text-sm font-medium text-[var(--text)] font-mono">
                  {expiry}
                </p>
              </div>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] transition-colors"
            >
              <Settings size={12} />
              {t('updateCard')}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <AddPaymentMethodModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      )}
    </Card>
  );
}
