'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/shared/ui/Button';
import { X, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { tenantApi } from '@/entities/subscription/api/tenantApi';
import type { PaymentMethod } from '@/entities/subscription/model/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

// ─── Inner form using Stripe hooks ──────────────────────────────────
function SetupCardForm({
  onSuccess,
  onError,
}: {
  onSuccess: (pm: PaymentMethod) => void;
  onError: (msg: string) => void;
}) {
  const t = useTranslations('billing');
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      // Confirm the SetupIntent — this saves the card to the Stripe customer
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || t('cardSetupError'));
        return;
      }

      if (setupIntent?.status === 'succeeded' || setupIntent?.status === 'requires_confirmation') {
        // Extract the payment method ID from the setup intent
        const pmId =
          typeof setupIntent.payment_method === 'string'
            ? setupIntent.payment_method
            : (setupIntent.payment_method as any)?.id;

        if (!pmId) {
          onError(t('cardSetupError'));
          return;
        }

        // Attach + set as default on the backend
        const updated = await tenantApi.updatePaymentMethod(pmId);
        onSuccess(updated as PaymentMethod);
      }
    } catch {
      onError(t('cardSetupError'));
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
            {t('processing')}
          </>
        ) : (
          t('saveCard')
        )}
      </Button>
    </form>
  );
}

// ─── Modal wrapper ──────────────────────────────────────────────────
interface AddPaymentMethodModalProps {
  onClose: () => void;
  onSuccess: (pm: PaymentMethod) => void;
}

export default function AddPaymentMethodModal({
  onClose,
  onSuccess,
}: AddPaymentMethodModalProps) {
  const t = useTranslations('billing');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create SetupIntent on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await tenantApi.createSetupIntent();
        if (!cancelled) setClientSecret(result.clientSecret);
      } catch (err: any) {
        if (!cancelled) setError(err.message || t('cardSetupError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl p-6 space-y-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--bg)] transition-colors text-[var(--text-muted)]"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--primary-color)]/10 flex items-center justify-center">
            <CreditCard size={20} className="text-[var(--primary-color)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">
              {t('addPaymentMethod')}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {t('addPaymentMethodDesc')}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Stripe Elements form */}
        {clientSecret && !error && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SetupCardForm
              onSuccess={onSuccess}
              onError={setError}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
