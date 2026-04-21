import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/store';

const API_URL = import.meta.env.DEV ? 'http://localhost:5000/api/auth' : '/api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLoginView ? '/login' : '/register';
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Произошла ошибка');
      }

      if (isLoginView) {
        // Успешный логин -> сохраняем стейт и идем в админку (или на главную, если роль user)
        login(data.token, data.user);
        if (data.user.role === 'user') {
          alert('Вход выполнен. Ожидайте, пока суперадмин выдаст вам права менеджера.');
          navigate('/');
        } else {
          navigate('/admin');
        }
      } else {
        // Успешная регистрация -> переключаем на логин
        alert('Регистрация успешна! Теперь войдите в систему.');
        setIsLoginView(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface, #f9fafb)' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--color-bg, #fff)', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: '12px', padding: '40px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginBottom: '4px' }}>{isLoginView ? 'Войти в систему' : 'Регистрация'}</h2>
        <p style={{ color: 'var(--color-text-muted, gray)', fontSize: '14px', marginBottom: '32px' }}>
          Панель управления GoPublica
        </p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLoginView && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Имя</label>
              <input
                type="text" required
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border, #d1d5db)', borderRadius: '6px', fontSize: '15px', outline: 'none' }}
              />
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Email</label>
            <input
              type="email" required
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border, #d1d5db)', borderRadius: '6px', fontSize: '15px', outline: 'none' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>Пароль</label>
            <input
              type="password" required minLength={6}
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border, #d1d5db)', borderRadius: '6px', fontSize: '15px', outline: 'none' }}
            />
          </div>
          
          <button type="submit" disabled={loading} style={{ padding: '12px', fontSize: '15px', marginTop: '8px', background: 'black', color: 'white', borderRadius: '6px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Загрузка...' : (isLoginView ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          <span style={{ color: 'gray' }}>
            {isLoginView ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          </span>
          <button 
            onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 500, padding: 0 }}
          >
            {isLoginView ? 'Создать' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}