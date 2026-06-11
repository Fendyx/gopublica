'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { useTenantAuthStore } from '@/store/tenantAuthStore';
import { tenantApi } from '@/entities/subscription/api/tenantApi';
import ConsentCheckboxes from '@/shared/ui/ConsentCheckboxes';

const HAS_TRIAL = true;
const BASE_PRICE = 39.0;

const VAT_RATES: Record<string, number> = {
  PL: 0.23, DE: 0.19, CZ: 0.21, ES: 0.21, FR: 0.20, IT: 0.22, NL: 0.21,
};

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

export default function SubscribeForm() {
  const t = useTranslations('subscribe');
  const router = useRouter();
  const searchParams = useSearchParams();
  const priceId = searchParams.get('priceId');
  const stripe = useStripe();
  const elements = useElements();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const { token, user, login } = useTenantAuthStore();
  const isGuest = !token;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [vatId, setVatId] = useState(user?.vatId || '');
  const [country, setCountry] = useState('PL');

  useEffect(() => {
    if (!priceId) router.replace('/pricing');
  }, [priceId, router]);

  const calculatePricing = () => {
    if (HAS_TRIAL) return { subtotal: BASE_PRICE, tax: 0, total: 0, rate: 0, isReverseCharge: false };
    const standardRate = VAT_RATES[country] || 0;
    const isReverseCharge = vatId.trim().length > 0 && country !== 'PL';
    const currentRate = isReverseCharge ? 0 : standardRate;
    const tax = BASE_PRICE * currentRate;
    return { subtotal: BASE_PRICE, tax, total: BASE_PRICE + tax, rate: currentRate * 100, isReverseCharge };
  };

  const pricing = calculatePricing();
  const isBasic = priceId === 'price_1TcswhLqSWMZrmileY2yjcHb';

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
    let currentToken = token; // текущий токен (может быть null для гостя)

    if (isGuest) {
      if (password.length < 6) throw new Error(t('errorPassword'));
      const regData = await tenantApi.register({
        name, email, password, companyName, vatId,
        termsAccepted, privacyAccepted, marketingConsent,
      });
      // Логинимся и запоминаем новый токен
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

    // Получаем обновлённые данные пользователя
    const updatedUser = await tenantApi.getMe();

    // Обновляем пользователя в сторе (токен уже правильный)
    useTenantAuthStore.getState().updateUser(updatedUser);

    router.push('/dashboard?success=true');
  } catch (err: any) {
    setError(err.message || t('errorGeneral'));
  } finally {
    setLoading(false);
  }
};

  if (!priceId) return null;

  return (
    <div className="min-h-screen bg-[var(--bg)] py-16 px-4 text-[var(--text)]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
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

        {error && (
          <div className="max-w-4xl mx-auto mb-8 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_440px] max-w-6xl mx-auto items-start">
          {/* Левая часть */}
          <div className="space-y-10">
            {isGuest && (
              <section>
                <h2 className="text-xl font-semibold border-b border-[var(--border)] pb-3 mb-5">
                  1. {t('stepCreateAccount')}
                </h2>
                <div className="grid gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">{t('fullName')}</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jan Kowalski"
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">{t('email')}</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jan@restaurant.pl"
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">{t('password')}</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder')}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                    />
                  </div>
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xl font-semibold border-b border-[var(--border)] pb-3 mb-5">
                {isGuest ? '2.' : '1.'} {t('stepInvoiceData')}
              </h2>
              <div className="grid gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">{t('country')}</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                  >
                    {Object.keys(VAT_RATES).map((code) => (
                      <option key={code} value={code}>
                        {t(`countries.${code}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">{t('companyName')}</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Super Burger GmbH"
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">{t('vatId')}</label>
                    <input
                      type="text"
                      value={vatId}
                      onChange={(e) => setVatId(e.target.value)}
                      placeholder="DE123456789"
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Согласия */}
            <div>
              <ConsentCheckboxes
                termsChecked={termsAccepted}
                privacyChecked={privacyAccepted}
                marketingChecked={marketingConsent}
                onTermsChange={setTermsAccepted}
                onPrivacyChange={setPrivacyAccepted}
                onMarketingChange={setMarketingConsent}
                showMarketing={true}
              />
            </div>
          </div>

          {/* Правая часть — платёжная карточка */}
          <div className="lg:sticky lg:top-10">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-sm p-8 shadow-sm">
              <h2 className="text-xl font-semibold border-b border-[var(--border)] pb-3 mb-6">
                {isGuest ? '3.' : '2.'} {t('stepPayment')}
              </h2>

              {/* Сводка заказа */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-5 mb-6">
                <p className="text-sm font-medium mb-3">
                  {t('plan')} <strong>{isBasic ? 'Go Publica Basic' : 'Go Publica Pro'}</strong>
                </p>
                {HAS_TRIAL ? (
                  <div className="text-sm text-green-600 font-semibold">30-day free trial</div>
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

              {/* Платёжные поля Stripe */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">{t('cardNumber')}</label>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <CardNumberElement options={stripeElementOptions} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">{t('expiryDate')}</label>
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                      <CardExpiryElement options={stripeElementOptions} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">{t('cvc')}</label>
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                      <CardCvcElement options={stripeElementOptions} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full rounded-lg bg-[var(--primary-color)] py-4 text-white font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {loading
                  ? t('processing')
                  : HAS_TRIAL
                    ? t('startTrialBtn')
                    : `${t('payBtn')} €${pricing.total.toFixed(2)}`}
              </button>
              <p className="text-center text-xs text-[var(--text-muted)] mt-4">{t('secureNotice')}</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}