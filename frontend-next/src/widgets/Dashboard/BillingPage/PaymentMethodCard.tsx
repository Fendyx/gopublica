'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/shared/ui/Card';
import { Plus, Settings } from 'lucide-react';
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaCreditCard } from 'react-icons/fa';
import type { PaymentMethod } from '@/entities/subscription/model/types';
import AddPaymentMethodModal from './AddPaymentMethodModal';

// ─── Brand Icon Helper ──────────────────────────────────────────────
function getBrandLogo(brand: string | null) {
  const size = 32;
  switch (brand) {
    case 'visa': return <FaCcVisa size={size} className="text-[var(--text-muted)]" />;
    case 'mastercard': return <FaCcMastercard size={size} className="text-[var(--text-muted)]" />;
    case 'amex': return <FaCcAmex size={size} className="text-[var(--text-muted)]" />;
    default: return <FaCreditCard size={size} className="text-[var(--text-muted)]" />;
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
              <FaCreditCard size={28} className="text-[var(--text-muted)]" />
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
