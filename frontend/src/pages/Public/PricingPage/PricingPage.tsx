import { useNavigate } from 'react-router-dom';
import { useTenantAuthStore } from '../../../store/tenantAuthStore';
import { Check } from 'lucide-react';
import './PricingPage.css';

// Замени на реальные Price ID из Stripe Dashboard
const PLANS = [
  {
    id:      'basic',
    name:    'Basic',
    price:   '39',
    priceId: 'price_1TcswhLqSWMZrmileY2yjcHb', // ← заменить
    features: [
      'Сайт ресторана',
      'Управление меню',
      'Форма бронирования',
      'Галерея',
      'Поддержка по email',
    ],
  },
  {
    id:      'pro',
    name:    'Pro',
    price:   '69',
    priceId: 'price_1TcsyDLqSWMZrmilWUKPEXnJ', // ← заменить
    popular: true,
    features: [
      'Всё из Basic',
      'Мультиязычность',
      'SEO-оптимизация',
      'Telegram-уведомления',
      'Приоритетная поддержка',
      'Кастомный домен',
    ],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { token, user } = useTenantAuthStore();

  const handleChoosePlan = (priceId: string) => {
    // Не авторизован — на регистрацию, затем на страницу оплаты
    if (!token) {
      navigate('/register', { state: { priceId } });
      return;
    }

    // Уже есть активная подписка или триал — в личный кабинет
    if (user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing') {
      navigate('/dashboard');
      return;
    }

    // Авторизован, нет подписки — переходим на страницу ввода карты
    navigate(`/subscribe?priceId=${priceId}`);
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Выберите план</h1>
        <p>Первые 30 дней — бесплатно. Без привязки карты.</p>
      </div>

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div key={plan.id} className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}>
            {plan.popular && <span className="pricing-badge">Популярный</span>}
            <h2 className="pricing-plan-name">{plan.name}</h2>
            <div className="pricing-price">
              <span className="pricing-amount">{plan.price}€</span>
              <span className="pricing-period">/месяц</span>
            </div>

            <ul className="pricing-features">
              {plan.features.map((f) => (
                <li key={f}>
                  <Check size={16} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              className={`pricing-btn ${plan.popular ? 'pricing-btn--primary' : 'pricing-btn--secondary'}`}
              onClick={() => handleChoosePlan(plan.priceId)}
            >
              Начать бесплатно
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}