import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../ui/LanguageSelector';
import { useAuthStore } from '../../store/store'; // Подключаем наш стор
import './NavBar.css';

export default function NavBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Достаем юзера и функцию выхода
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Логотип */}
        <Link to="/" className="navbar-logo">
          GoPublica
        </Link>

        {/* Навигация */}
        <div className="navbar-links">
          <Link to="/">{t('nav.home', 'Главная')}</Link>
          <Link to="/calculator">{t('nav.calculator', 'Калькулятор')}</Link>
          <Link to="/contact">{t('nav.contact', 'Контакты')}</Link>
        </div>

        {/* Действия (Справа) */}
        <div className="navbar-actions">
          <LanguageSelector />
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Показываем ссылку на админку ТОЛЬКО админам */}
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <Link to="/admin" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>
                  Панель управления
                </Link>
              )}
              
              <Link to="/profile" style={{ fontWeight: 500, textDecoration: 'none', color: 'black', fontSize: '14px' }}>
                👤 {user.name}
              </Link>
              
              <button 
                onClick={handleLogout} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 500, fontSize: '14px' }}
              >
                Выйти
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              {t('nav.login', 'Войти')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}