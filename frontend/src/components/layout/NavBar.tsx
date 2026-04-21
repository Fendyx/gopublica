import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../ui/LanguageSelector';
import { useAuthStore } from '../../store/store';
import './NavBar.css';

export default function NavBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  // Стейт для мобильного меню
  const [isOpen, setIsOpen] = useState(false);

  // Функция для закрытия меню при клике на ссылку
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Логотип */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          GoPublica
        </Link>

        {/* Кнопка бургера (видна только на мобилках) */}
        <button 
          className="hamburger" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span className={`bar ${isOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isOpen ? 'open' : ''}`}></span>
        </button>

        {/* Обертка для меню (ссылки + действия) */}
        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          
          <div className="navbar-links">
            <Link to="/" onClick={closeMenu}>{t('nav.home', 'Главная')}</Link>
            <Link to="/calculator" onClick={closeMenu}>{t('nav.calculator', 'Калькулятор')}</Link>
            <Link to="/contact" onClick={closeMenu}>{t('nav.contact', 'Контакты')}</Link>
          </div>

          <div className="navbar-actions">
            {/* Обернул LanguageSelector в div, чтобы он красиво смотрелся в мобильном меню */}
            <div className="lang-wrapper">
              <LanguageSelector />
            </div>
            
            {user ? (
              <div className="user-actions">
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <Link to="/admin" className="admin-link" onClick={closeMenu}>
                    Панель управления
                  </Link>
                )}
                
                <Link to="/profile" className="profile-link" onClick={closeMenu}>
                  👤 {user.name}
                </Link>
                
                <button onClick={handleLogout} className="btn-logout">
                  Выйти
                </button>
              </div>
            ) : (
               <Link to="/login" className="btn-login" onClick={closeMenu}>
                 {t('nav.login', 'Войти')}
               </Link>
            )}
          </div>
          
        </div>
      </div>
    </nav>
  );
}