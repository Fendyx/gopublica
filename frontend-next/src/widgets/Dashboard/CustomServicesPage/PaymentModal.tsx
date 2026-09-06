'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/shared/ui/Button';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { customServiceApi } from '@/entities/customService/api/customServiceApi';
import type { CustomService } from '@/entities/customService/model/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

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

// ─── Inner form using Stripe hooks ──────────────────────────────────
function PaymentForm({
  service,
  onSuccess,
  onError,
}: {
  service: CustomService;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const t = useTranslations('customServices');
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || t('payment.error'));
      } else {
        onSuccess();
      }
    } catch {
      onError(t('payment.error'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full gap-2 rounded-xl"
      >
        {processing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {t('payment.processing')}
          </>
        ) : (
          t('payment.confirm', { amount: formatCurrency(service.price, service.currency.toUpperCase()) })
        )}
      </Button>
    </form>
  );
}

// ─── Modal wrapper ──────────────────────────────────────────────────
interface PaymentModalProps {
  service: CustomService;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ service, onClose, onSuccess }: PaymentModalProps) {
  const t = useTranslations('customServices');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create PaymentIntent on mount
  useState(() => {
    (async () => {
      try {
        const result = await customServiceApi.pay(service._id);
        setClientSecret(result.clientSecret);
      } catch (err: any) {
        setError(err.message || t('payment.error'));
      } finally {
        setLoading(false);
      }
    })();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl p-6 space-y-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--bg)] transition-colors text-[var(--text-muted)]"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">{t('payment.title')}</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{service.title}</p>
          <p className="text-xl font-bold text-[var(--text)] mt-2">
            {formatCurrency(service.price, service.currency.toUpperCase())}
          </p>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {clientSecret && !error && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              service={service}
              onSuccess={onSuccess}
              onError={setError}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
