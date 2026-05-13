// NavBar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import LanguageSelector from '../ui/LanguageSelector';
import { useAuthStore } from '../../store/store';
import './NavBar.css';
import { ThemeToggle } from '../shared/ThemeToggle';

export default function NavBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);
  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          GoPublica
        </Link>

        <button 
          className="hamburger" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <div className="navbar-links">
            <Link to="/" onClick={closeMenu}>{t('nav.home', 'Главная')}</Link>
            <Link to="/calculator" onClick={closeMenu}>{t('nav.calculator', 'Калькулятор')}</Link>
            <Link to="/contact" onClick={closeMenu}>{t('nav.contact', 'Контакты')}</Link>
          </div>

          <div className="navbar-actions">
            <div className="lang-wrapper">
              <LanguageSelector />
            </div>

            <div className="ThemeToggle">
              <ThemeToggle />
            </div>
            
            {user ? (
              <div className="user-actions">
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <Link to="/admin" className="action-link admin-link" onClick={closeMenu}>
                    <LayoutDashboard size={14} />
                    <span>Панель</span>
                  </Link>
                )}
                
                <Link to="/profile" className="action-link profile-link" onClick={closeMenu}>
                  <User size={14} />
                  <span>{user.name}</span>
                </Link>
                
                <button onClick={handleLogout} className="action-link btn-logout">
                  <LogOut size={14} />
                  <span>Выйти</span>
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