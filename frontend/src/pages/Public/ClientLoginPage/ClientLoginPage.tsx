import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tenantApi } from '../../../features/tenant/api/tenantApi';
import { useTenantAuthStore } from '../../../store/tenantAuthStore';
import './ClientLoginPage.css';

export default function ClientLoginPage() {
  const navigate  = useNavigate();
  const { login } = useTenantAuthStore();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await tenantApi.login(form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-login-page">
      <div className="client-login-card">
        <h1>Вход в личный кабинет</h1>
        <p className="client-login-subtitle">
          Нет аккаунта? <Link to="/pricing">Выбрать план</Link>
        </p>

        {error && <div className="client-login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="client-login-form">
          <div className="client-login-field">
            <label>Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="jan@restaurant.pl"
            />
          </div>
          <div className="client-login-field">
            <label>Пароль</label>
            <input
              type="password" required
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Ваш пароль"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}