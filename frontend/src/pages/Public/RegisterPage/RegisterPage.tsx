import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { tenantApi } from '../../../features/tenant/api/tenantApi';
import { useTenantAuthStore } from '../../../store/tenantAuthStore';
import './RegisterPage.css';

export default function RegisterPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useTenantAuthStore();

  // priceId может прилететь со страницы /pricing
  const priceId = (location.state as any)?.priceId;

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '',
    companyName: '', vatId: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Пароли не совпадают');
      return;
    }

    if (form.password.length < 6) {
      setError('Минимум 6 символов в пароле');
      return;
    }

    setLoading(true);
    try {
      const data = await tenantApi.register({
        name:        form.name,
        email:       form.email,
        phone:       form.phone,
        password:    form.password,
        companyName: form.companyName,
        vatId:       form.vatId,
      });

      login(data.token, data.user);

      // Если пришли с выбора плана — переходим на страницу ввода карты (Stripe Elements)
      if (priceId) {
        navigate(`/subscribe?priceId=${priceId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>Создать аккаунт</h1>
        <p className="register-subtitle">
          Уже есть аккаунт? <Link to="/login-client">Войти</Link>
        </p>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-field">
            <label>Имя и фамилия *</label>
            <input
              name="name" type="text" required
              value={form.name} onChange={handleChange}
              placeholder="Jan Kowalski"
            />
          </div>

          <div className="register-field">
            <label>Email *</label>
            <input
              name="email" type="email" required
              value={form.email} onChange={handleChange}
              placeholder="jan@restaurant.pl"
            />
          </div>

          <div className="register-field">
            <label>Телефон</label>
            <input
              name="phone" type="tel"
              value={form.phone} onChange={handleChange}
              placeholder="+48 123 456 789"
            />
          </div>

          <div className="register-field">
            <label>Компания (опционально)</label>
            <input
              name="companyName" type="text"
              value={form.companyName} onChange={handleChange}
              placeholder="Название ресторана"
            />
          </div>

          <div className="register-field">
            <label>VAT EU (опционально)</label>
            <input
              name="vatId" type="text"
              value={form.vatId} onChange={handleChange}
              placeholder="DE123456789"
            />
          </div>

          <div className="register-field">
            <label>Пароль *</label>
            <input
              name="password" type="password" required
              value={form.password} onChange={handleChange}
              placeholder="Минимум 6 символов"
            />
          </div>

          <div className="register-field">
            <label>Повторите пароль *</label>
            <input
              name="confirm" type="password" required
              value={form.confirm} onChange={handleChange}
              placeholder="Повторите пароль"
            />
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}