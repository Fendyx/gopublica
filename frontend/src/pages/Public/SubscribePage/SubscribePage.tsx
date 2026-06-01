import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useTenantAuthStore } from '../../../store/tenantAuthStore';
import { tenantApi } from '../../../features/tenant/api/tenantApi';
import './SubscribePage.css';

export default function SubscribePage() {
  const [params] = useSearchParams();
  const priceId = params.get('priceId');
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { token, user, login } = useTenantAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Поля компании и VAT (предзаполняем из профиля)
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [vatId, setVatId] = useState(user?.vatId || '');

  // Если нет priceId, возвращаем на выбор плана
  useEffect(() => {
    if (!priceId) navigate('/pricing');
  }, [priceId, navigate]);

  // Если не авторизован — на регистрацию, после которой вернёмся сюда
  useEffect(() => {
    if (!token) {
      navigate('/register', { state: { priceId } });
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      // 1. Получаем clientSecret для SetupIntent
      const { clientSecret } = await tenantApi.createSetupIntent();

      // 2. Подтверждаем SetupIntent, карта сохраняется
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('CardElement not found');

      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (setupError) {
        throw new Error(setupError.message);
      }

      // 3. Создаём подписку с триалом (передаём компанию и VAT)
      const paymentMethodId = setupIntent.payment_method as string;
      await tenantApi.subscribeWithPaymentMethod(
        paymentMethodId,
        priceId!,
        companyName,
        vatId
      );

      // 4. Обновляем данные пользователя в сторе
      const updatedUser = await tenantApi.getMe();
      login(token!, updatedUser);

      navigate('/dashboard?success=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!priceId || !token) return null;

  return (
    <div className="subscribe-page">
      <div className="subscribe-card">
        <h1>Оформление подписки</h1>
        <p>План: <strong>{priceId === 'price_1TcswhLqSWMZrmileY2yjcHb' ? 'Basic' : 'Pro'}</strong></p>
        <p className="subscribe-trial">Первые 30 дней бесплатно</p>

        {error && <div className="subscribe-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Поля компании и VAT */}
          <div className="register-field">
            <label>Компания (опционально)</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Название ресторана"
            />
          </div>

          <div className="register-field">
            <label>VAT EU (опционально)</label>
            <input
              type="text"
              value={vatId}
              onChange={(e) => setVatId(e.target.value)}
              placeholder="DE123456789"
            />
          </div>

          <div className="card-element-wrapper">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': { color: '#aab7c4' },
                  },
                  invalid: { color: '#9e2146' },
                },
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!stripe || loading}
            className="subscribe-btn"
          >
            {loading ? 'Обработка...' : 'Начать бесплатный триал'}
          </button>
        </form>
      </div>
    </div>
  );
}