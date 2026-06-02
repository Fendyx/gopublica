import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  useStripe, 
  useElements, 
  CardNumberElement, 
  CardExpiryElement, 
  CardCvcElement 
} from '@stripe/react-stripe-js';
import { useTenantAuthStore } from '../../../store/tenantAuthStore';
import { tenantApi } from '../../../features/tenant/api/tenantApi';
import './SubscribePage.css';

const HAS_TRIAL = false; 
const BASE_PRICE = 39.00;

// Константа вынесена, чтобы итерировать по ней страны
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

export default function SubscribePage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const priceId = params.get('priceId');
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  
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
    if (!priceId) navigate('/pricing');
  }, [priceId, navigate]);

  const calculatePricing = () => {
    if (HAS_TRIAL) return { subtotal: BASE_PRICE, tax: 0, total: 0, rate: 0, isReverseCharge: false };

    const standardRate = VAT_RATES[country] || 0;
    const isReverseCharge = vatId.trim().length > 0 && country !== 'PL';
    const currentRate = isReverseCharge ? 0 : standardRate;
    const tax = BASE_PRICE * currentRate;

    return { subtotal: BASE_PRICE, tax, total: BASE_PRICE + tax, rate: currentRate * 100, isReverseCharge };
  };

  const pricing = calculatePricing();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      if (isGuest) {
        if (password.length < 6) throw new Error(t('subscribe.errorPassword'));
        const regData = await tenantApi.register({ name, email, password, companyName, vatId });
        login(regData.token, regData.user);
      }

      const { clientSecret } = await tenantApi.createSetupIntent();
      
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) throw new Error(t('subscribe.errorCard'));

      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardNumberElement },
      });

      if (setupError) throw new Error(setupError.message);

      const paymentMethodId = setupIntent.payment_method as string;
      await tenantApi.subscribeWithPaymentMethod(paymentMethodId, priceId!, companyName, vatId, country);

      const updatedUser = await tenantApi.getMe();
      login(token!, updatedUser);

      navigate('/dashboard?success=true');
    } catch (err: any) {
      setError(err.message || t('subscribe.errorGeneral'));
    } finally {
      setLoading(false);
    }
  };

  if (!priceId) return null;
  const isBasic = priceId === 'price_1TcswhLqSWMZrmileY2yjcHb';

  return (
    <div className="checkout-page">
      <div className="checkout-header-global">
        <h1>{t('subscribe.title')}</h1>
        {isGuest && <p>{t('subscribe.alreadyHaveAccount')} <Link to="/login-client">{t('subscribe.login')}</Link></p>}
      </div>

      {error && <div className="checkout-error">{error}</div>}

      <form id="checkout-form" onSubmit={handleSubmit} className="checkout-container">
        
        <div className="checkout-left">
          
          {isGuest && (
            <div className="form-section">
              <h2>1. {t('subscribe.stepCreateAccount')}</h2>
              <div className="form-group">
                <label>{t('subscribe.fullName')}</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jan Kowalski" />
              </div>
              <div className="form-group">
                <label>{t('subscribe.email')}</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@restaurant.pl" />
              </div>
              <div className="form-group">
                <label>{t('subscribe.password')}</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder={t('subscribe.passwordPlaceholder')} />
              </div>
            </div>
          )}

          <div className="form-section">
            <h2>{isGuest ? '2.' : '1.'} {t('subscribe.stepInvoiceData')}</h2>
            <div className="form-group">
              <label>{t('subscribe.country')}</label>
              <select value={country} onChange={e => setCountry(e.target.value)} required>
                {Object.keys(VAT_RATES).map(code => (
                  <option key={code} value={code}>
                    {t(`subscribe.countries.${code}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('subscribe.companyName')}</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Super Burger GmbH" />
              </div>
              <div className="form-group">
                <label>{t('subscribe.vatId')}</label>
                <input type="text" value={vatId} onChange={e => setVatId(e.target.value)} placeholder="DE123456789" />
              </div>
            </div>
          </div>
        </div>

        <div className="checkout-right">
          <div className="payment-sticky-card">
            <h2>{isGuest ? '3.' : '2.'} {t('subscribe.stepPayment')}</h2>
            
            <div className="integrated-summary">
              <div className="summary-header">
                <span>{t('subscribe.plan')} <strong>{isBasic ? 'Go Publica Basic' : 'Go Publica Pro'}</strong></span>
              </div>

              {HAS_TRIAL ? (
                <div className="summary-trial-badge">{t('subscribe.trialBadge')}</div>
              ) : (
                <div className="summary-details">
                  <div className="summary-row">
                    <span>{t('subscribe.netPrice')}</span>
                    <span>€{pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>
                      {t('subscribe.vatTax')} ({pricing.rate}%)
                      {pricing.isReverseCharge && <span className="badge-rc">{t('subscribe.reverseCharge')}</span>}
                    </span>
                    <span>€{pricing.tax.toFixed(2)}</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row summary-total">
                    <span>{t('subscribe.total')}</span>
                    <span>€{pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="payment-input-area">
              <div className="form-group stripe-field-group">
                <label>{t('subscribe.cardNumber')}</label>
                <div className="stripe-input-wrapper">
                  <CardNumberElement options={stripeElementOptions} />
                </div>
              </div>
              
              <div className="form-row stripe-row">
                <div className="form-group stripe-field-group">
                  <label>{t('subscribe.expiryDate')}</label>
                  <div className="stripe-input-wrapper">
                    <CardExpiryElement options={stripeElementOptions} />
                  </div>
                </div>
                <div className="form-group stripe-field-group">
                  <label>{t('subscribe.cvc')}</label>
                  <div className="stripe-input-wrapper">
                    <CardCvcElement options={stripeElementOptions} />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={!stripe || loading} className="checkout-submit-btn">
              {loading 
                ? t('subscribe.processing') 
                : HAS_TRIAL 
                  ? t('subscribe.startTrialBtn') 
                  : `${t('subscribe.payBtn')} €${pricing.total.toFixed(2)}`
              }
            </button>
            
            <p className="checkout-secure-notice">
              {t('subscribe.secureNotice')}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}