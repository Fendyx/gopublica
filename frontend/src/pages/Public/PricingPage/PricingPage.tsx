import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTenantAuthStore } from '../../../store/tenantAuthStore';
import { Check } from 'lucide-react';
import './PricingPage.css';

export default function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user } = useTenantAuthStore();

  // Массив перенесен внутрь компонента для доступа к функции t()
  const PLANS = [
    {
      id:      'basic',
      name:    'Basic',
      price:   '39',
      priceId: 'price_1TcswhLqSWMZrmileY2yjcHb', // ← заменить
      features: t('pricing.plans.basic.features', { returnObjects: true }) as string[],
    },
    {
      id:      'pro',
      name:    'Pro',
      price:   '69',
      priceId: 'price_1TcsyDLqSWMZrmilWUKPEXnJ', // ← заменить
      popular: true,
      features: t('pricing.plans.pro.features', { returnObjects: true }) as string[],
    },
  ];

  const handleChoosePlan = (priceId: string) => {
    // Уже есть активная подписка — в личный кабинет
    if (user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing') {
      navigate('/dashboard');
      return;
    }
    // ВСЕ ОСТАЛЬНЫЕ (с аккаунтом или без) -> на страницу оформления!
    navigate(`/subscribe?priceId=${priceId}`);
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>{t('pricing.title')}</h1>
        <p>{t('pricing.subtitle')}</p>
      </div>

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}>
            {plan.popular && <div className="pricing-badge">{t('pricing.badge')}</div>}
            
            <div className="pricing-card-header">
              <h2 className="pricing-plan-name">{plan.name}</h2>
              <div className="pricing-price">
                <span className="pricing-amount">{plan.price}€</span>
                <div className="pricing-price-meta">
                  <span className="pricing-period">{t('pricing.period')}</span>
                  <span className="pricing-tax-notice">{t('pricing.net')}</span>
                </div>
              </div>
            </div>

            <ul className="pricing-features">
              {plan.features.map((f, index) => (
                <li key={index} className="pricing-feature-item">
                  <Check size={16} className="pricing-feature-icon" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              className={`pricing-btn ${plan.popular ? 'pricing-btn--primary' : 'pricing-btn--secondary'}`}
              onClick={() => handleChoosePlan(plan.priceId)}
            >
              {t('pricing.btnText')}
            </button>
          </div>
        ))}
      </div>

      <p className="pricing-footer-notice">
        {t('pricing.footerNotice')}
      </p>
    </div>
  );
}