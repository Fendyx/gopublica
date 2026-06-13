'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';
import type { PaymentRequest } from '@stripe/stripe-js';
import {
  Lock,
  Mail,
  User,
  KeyRound,
  Building2,
  ReceiptText,
  Globe,
  CreditCard,
  ShieldCheck,
  BadgeCheck,
  ChevronRight,
  CircleAlert,
} from 'lucide-react';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { tenantApi } from '@/entities/subscription/api/tenantApi';
import ConsentCheckboxes from '@/shared/ui/ConsentCheckboxes';

// ─── Config ──────────────────────────────────────────────────────────────────

const HAS_TRIAL = true;
const BASE_PRICE = 39.0;
const TRIAL_DAYS = 30;

const VAT_RATES: Record<string, number> = {
  PL: 0.23, DE: 0.19, CZ: 0.21, ES: 0.21, FR: 0.20, IT: 0.22, NL: 0.21,
};

// ─── Stripe element style ────────────────────────────────────────────────────

const stripeElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#111827',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#dc2626' },
  },
};

// ─── Small helpers ───────────────────────────────────────────────────────────

function FieldWrapper({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold">
        <Icon size={14} className="text-[var(--text-muted)]" />
        {label}
      </label>
      {children}
    </div>
  );
}

function InputField({
  icon: Icon,
  ...props
}: { icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
        <Icon size={16} />
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 py-3 text-sm
          focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-shadow"
      />
    </div>
  );
}

function StripeField({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <FieldWrapper label={label} icon={Icon}>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        {children}
      </div>
    </FieldWrapper>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function OrDivider({ label = 'or pay with card' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <hr className="flex-1 border-[var(--border)]" />
      <span className="text-xs text-[var(--text-muted)] font-medium whitespace-nowrap">{label}</span>
      <hr className="flex-1 border-[var(--border)]" />
    </div>
  );
}

// ─── Card brand icons (SVG inline, no external dep) ──────────────────────────

const CARD_ICONS = [
  // Visa
  <svg key="visa" width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
    <rect width="38" height="24" rx="4" fill="#1434CB"/>
    <path d="M15.2 16.5H12.8L14.3 7.5H16.7L15.2 16.5Z" fill="white"/>
    <path d="M22.6 7.7C22.1 7.5 21.3 7.3 20.3 7.3C17.9 7.3 16.2 8.6 16.2 10.4C16.2 11.7 17.4 12.4 18.3 12.8C19.2 13.2 19.5 13.5 19.5 13.9C19.5 14.5 18.8 14.8 18.1 14.8C17.1 14.8 16.6 14.6 15.8 14.3L15.5 14.1L15.2 16.1C15.8 16.4 16.9 16.6 18 16.6C20.6 16.6 22.2 15.3 22.2 13.4C22.2 12.4 21.6 11.6 20.3 11C19.5 10.6 19 10.4 19 10C19 9.6 19.5 9.2 20.4 9.2C21.2 9.2 21.8 9.4 22.2 9.6L22.4 9.7L22.6 7.7Z" fill="white"/>
    <path d="M26.2 13.2L27.1 10.8C27.1 10.8 27.3 10.3 27.4 10L27.6 10.7L28.3 13.2H26.2ZM29.2 7.5H27.3C26.7 7.5 26.2 7.7 25.9 8.3L22.3 16.5H24.9L25.4 15.1H28.6L28.9 16.5H31.2L29.2 7.5Z" fill="white"/>
    <path d="M13.2 7.5L10.8 13.3L10.5 11.9C10 10.4 8.6 8.8 7 7.9L9.2 16.5H11.8L15.8 7.5H13.2Z" fill="white"/>
    <path d="M8.4 7.5H4.4L4.4 7.7C7.4 8.5 9.4 10.3 10.2 12.3L9.4 8.4C9.2 7.8 8.9 7.5 8.4 7.5Z" fill="#F9A51A"/>
  </svg>,
  // Mastercard
  <svg key="mc" width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
    <rect width="38" height="24" rx="4" fill="#252525"/>
    <circle cx="14.5" cy="12" r="6" fill="#EB001B"/>
    <circle cx="23.5" cy="12" r="6" fill="#F79E1B"/>
    <path d="M19 7.8C20.4 8.8 21.5 10.3 21.5 12C21.5 13.7 20.4 15.2 19 16.2C17.6 15.2 16.5 13.7 16.5 12C16.5 10.3 17.6 8.8 19 7.8Z" fill="#FF5F00"/>
  </svg>,
  // Amex
  <svg key="amex" width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="American Express">
    <rect width="38" height="24" rx="4" fill="#2557D6"/>
    <text x="5" y="16" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="white">AMEX</text>
  </svg>,
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubscribeForm() {
  const t = useTranslations('subscribe');
  const router = useRouter();
  const searchParams = useSearchParams();
  const priceId = searchParams.get('priceId');
  const stripe = useStripe();
  const elements = useElements();

  // Consents
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const { token, user, login } = useTenantAuthStore();
  const isGuest = !token;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Guest fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Invoice fields
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [vatId, setVatId] = useState(user?.vatId || '');
  const [country, setCountry] = useState('PL');

  // Apple/Google Pay
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  useEffect(() => {
    if (!priceId) router.replace('/pricing');
  }, [priceId, router]);

  // ── Setup Apple Pay / Google Pay ──────────────────────────────────────────
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'PL',
      currency: 'eur',
      total: {
        label: HAS_TRIAL ? `${TRIAL_DAYS}-day free trial` : 'Go Publica subscription',
        amount: HAS_TRIAL ? 0 : Math.round(BASE_PRICE * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) setPaymentRequest(pr);
    });

    pr.on('paymentmethod', async (ev) => {
      setLoading(true);
      setError('');
      try {
        let currentToken = token;
        if (isGuest) {
          // For wallet pay we get name/email from the wallet
          const walletName = ev.payerName || name;
          const walletEmail = ev.payerEmail || email;
          if (!walletName || !walletEmail) {
            ev.complete('fail');
            throw new Error(t('errorCard'));
          }
          const regData = await tenantApi.register({
            name: walletName,
            email: walletEmail,
            password: Math.random().toString(36).slice(-10), // temp; user sets later
            companyName,
            vatId,
            termsAccepted,
            privacyAccepted,
            marketingConsent,
          });
          login(regData.token, regData.user);
          currentToken = regData.token;
        }

        const { clientSecret } = await tenantApi.createSetupIntent();
        const { error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: ev.paymentMethod.id,
        });

        if (confirmError) {
          ev.complete('fail');
          throw new Error(confirmError.message);
        }

        ev.complete('success');
        await tenantApi.subscribeWithPaymentMethod(ev.paymentMethod.id, priceId!, companyName, vatId, country);
        const updatedUser = await tenantApi.getMe();
        useTenantAuthStore.getState().updateUser(updatedUser);
        router.push('/dashboard?success=true');
      } catch (err: any) {
        setError(err.message || t('errorGeneral'));
      } finally {
        setLoading(false);
      }
    });
  }, [stripe]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pricing ───────────────────────────────────────────────────────────────
  const calculatePricing = useCallback(() => {
    if (HAS_TRIAL) return { subtotal: BASE_PRICE, tax: 0, total: 0, rate: 0, isReverseCharge: false };
    const standardRate = VAT_RATES[country] || 0;
    const isReverseCharge = vatId.trim().length > 0 && country !== 'PL';
    const currentRate = isReverseCharge ? 0 : standardRate;
    const tax = BASE_PRICE * currentRate;
    return { subtotal: BASE_PRICE, tax, total: BASE_PRICE + tax, rate: currentRate * 100, isReverseCharge };
  }, [country, vatId]);

  const pricing = calculatePricing();
  const isBasic = priceId === 'price_1TcswhLqSWMZrmileY2yjcHb';

  // ── Submit (card) ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!termsAccepted || !privacyAccepted) {
      setError(t('acceptTermsAndPrivacy'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      let currentToken = token;

      if (isGuest) {
        if (password.length < 6) throw new Error(t('errorPassword'));
        const regData = await tenantApi.register({
          name, email, password, companyName, vatId,
          termsAccepted, privacyAccepted, marketingConsent,
        });
        login(regData.token, regData.user);
        currentToken = regData.token;
      }

      const { clientSecret } = await tenantApi.createSetupIntent();
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) throw new Error(t('errorCard'));

      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardNumberElement },
      });
      if (setupError) throw new Error(setupError.message);

      const paymentMethodId = setupIntent.payment_method as string;
      await tenantApi.subscribeWithPaymentMethod(paymentMethodId, priceId!, companyName, vatId, country);

      const updatedUser = await tenantApi.getMe();
      useTenantAuthStore.getState().updateUser(updatedUser);
      router.push('/dashboard?success=true');
    } catch (err: any) {
      setError(err.message || t('errorGeneral'));
    } finally {
      setLoading(false);
    }
  };

  if (!priceId) return null;

  const stepOffset = isGuest ? 1 : 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] py-16 px-4 text-[var(--text)]">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">{t('title')}</h1>
          {isGuest && (
            <p className="text-[var(--text-muted)]">
              {t('alreadyHaveAccount')}{' '}
              <Link href="/login-client" className="text-[var(--primary-color)] font-semibold hover:underline">
                {t('login')}
              </Link>
            </p>
          )}
        </div>

        {/* Inline error banner */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-600">
            <CircleAlert size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-10 lg:grid-cols-[1fr_440px] max-w-6xl mx-auto items-start"
        >
          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="space-y-10">

            {/* Step 1 – Account (guests only) */}
            {isGuest && (
              <section>
                <SectionTitle step={1} label={t('stepCreateAccount')} />
                <div className="grid gap-4">
                  <FieldWrapper label={t('fullName')} icon={User}>
                    <InputField
                      icon={User}
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jan Kowalski"
                    />
                  </FieldWrapper>

                  <FieldWrapper label={t('email')} icon={Mail}>
                    <InputField
                      icon={Mail}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jan@restaurant.pl"
                    />
                  </FieldWrapper>

                  <FieldWrapper label={t('password')} icon={KeyRound}>
                    <InputField
                      icon={KeyRound}
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder')}
                    />
                  </FieldWrapper>
                </div>
              </section>
            )}

            {/* Step 2 – Invoice */}
            <section>
              <SectionTitle step={1 + stepOffset} label={t('stepInvoiceData')} />
              <div className="grid gap-4">
                <FieldWrapper label={t('country')} icon={Globe}>
                  <div className="relative">
                    <Globe
                      size={16}
                      className="pointer-events-none absolute inset-y-0 left-3 my-auto text-[var(--text-muted)]"
                    />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)]
                        pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-shadow"
                    >
                      {Object.keys(VAT_RATES).map((code) => (
                        <option key={code} value={code}>
                          {t(`countries.${code}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </FieldWrapper>

                <div className="grid grid-cols-2 gap-4">
                  <FieldWrapper label={t('companyName')} icon={Building2}>
                    <InputField
                      icon={Building2}
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Super Burger GmbH"
                    />
                  </FieldWrapper>

                  <FieldWrapper label={t('vatId')} icon={ReceiptText}>
                    <InputField
                      icon={ReceiptText}
                      type="text"
                      value={vatId}
                      onChange={(e) => setVatId(e.target.value)}
                      placeholder="DE123456789"
                    />
                  </FieldWrapper>
                </div>
              </div>
            </section>

            {/* Consents */}
            <div>
              <ConsentCheckboxes
                termsChecked={termsAccepted}
                privacyChecked={privacyAccepted}
                marketingChecked={marketingConsent}
                onTermsChange={setTermsAccepted}
                onPrivacyChange={setPrivacyAccepted}
                onMarketingChange={setMarketingConsent}
                showMarketing
              />
            </div>
          </div>

          {/* ── Right column – payment card ──────────────────────────────── */}
          <div className="lg:sticky lg:top-10">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-8 shadow-sm">
              <SectionTitle step={2 + stepOffset} label={t('stepPayment')} />

              {/* Order summary */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-5 mb-6">
                <p className="text-sm font-medium mb-3">
                  {t('plan')}{' '}
                  <strong>{isBasic ? 'Go Publica Basic' : 'Go Publica Pro'}</strong>
                </p>

                {HAS_TRIAL ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                      <BadgeCheck size={18} />
                      <span>{TRIAL_DAYS}-day free trial</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] pl-6">
                      No charge today. €{BASE_PRICE.toFixed(2)}/mo after trial.{' '}
                      Cancel anytime before day {TRIAL_DAYS}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t('netPrice')}</span>
                      <span>€{pricing.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        {t('vatTax')} ({pricing.rate}%)
                        {pricing.isReverseCharge && (
                          <span className="ml-1 rounded-full bg-purple-100 dark:bg-purple-900 px-2 py-0.5 text-xs font-bold uppercase text-purple-800 dark:text-purple-200">
                            {t('reverseCharge')}
                          </span>
                        )}
                      </span>
                      <span>€{pricing.tax.toFixed(2)}</span>
                    </div>
                    <hr className="border-[var(--border)]" />
                    <div className="flex justify-between font-extrabold text-base">
                      <span>{t('total')}</span>
                      <span className="text-[var(--primary-color)]">€{pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Apple Pay / Google Pay */}
              {paymentRequest && (
                <>
                  <PaymentRequestButtonElement
                    options={{
                      paymentRequest,
                      style: {
                        paymentRequestButton: {
                          type: 'subscribe',
                          theme: 'dark',
                          height: '52px',
                        },
                      },
                    }}
                  />
                  <OrDivider label={t('orPayWithCard') ?? 'or pay with card'} />
                </>
              )}

              {/* Card inputs */}
              <div className="space-y-4 mb-5">
                {/* Card number + brand icons */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-sm font-semibold">
                      <CreditCard size={14} className="text-[var(--text-muted)]" />
                      {t('cardNumber')}
                    </label>
                    <div className="flex items-center gap-1">
                      {CARD_ICONS}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <CardNumberElement options={stripeElementOptions} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StripeField label={t('expiryDate')} icon={CreditCard}>
                    <CardExpiryElement options={stripeElementOptions} />
                  </StripeField>
                  <StripeField label={t('cvc')} icon={Lock}>
                    <CardCvcElement options={stripeElementOptions} />
                  </StripeField>
                </div>
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--primary-color)]
                  py-4 text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-opacity"
              >
                <Lock size={18} />
                {loading
                  ? t('processing')
                  : HAS_TRIAL
                    ? t('startTrialBtn')
                    : `${t('payBtn')} €${pricing.total.toFixed(2)}`}
              </button>

              {/* Trust row */}
              <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                <TrustBadge icon={ShieldCheck} label="SSL secured" />
                <span className="text-[var(--border)] text-lg leading-none">·</span>
                <TrustBadge icon={Lock} label="Powered by Stripe" />
                <span className="text-[var(--border)] text-lg leading-none">·</span>
                <TrustBadge icon={BadgeCheck} label="Cancel anytime" />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ step, label }: { step: number; label: string }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold border-b border-[var(--border)] pb-3 mb-5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary-color)] text-white text-xs font-bold shrink-0">
        {step}
      </span>
      {label}
      <ChevronRight size={16} className="ml-auto text-[var(--text-muted)]" />
    </h2>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
      <Icon size={13} className="shrink-0" />
      {label}
    </span>
  );
}