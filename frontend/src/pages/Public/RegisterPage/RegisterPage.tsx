import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tenantApi } from '../../../features/tenant/api/tenantApi';
import { useTenantAuthStore } from '../../../store/tenantAuthStore';
import './RegisterPage.css';

export default function RegisterPage() {
  const navigate  = useNavigate();
  const { login } = useTenantAuthStore();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Минимум 6 символов в пароле');
      return;
    }

    setLoading(true);
    try {
      const data = await tenantApi.register(form);
      login(data.token, data.user);
      navigate('/dashboard'); // Просто редирект в ЛК
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Создать аккаунт</h1>
        <p className="auth-subtitle">
          Уже есть аккаунт? <Link to="/login-client">Войти</Link>
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Имя и фамилия</label>
            <input name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Jan Kowalski" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="jan@restaurant.pl" />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="Минимум 6 символов" />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Создание...' : 'Продолжить'}
          </button>
        </form>
      </div>
    </div>
  );
}