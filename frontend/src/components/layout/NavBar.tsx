// NavBar.tsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import LanguageSelector from '../ui/LanguageSelector';
import './NavBar.css';

export default function NavBar() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const closeMenu = () => setIsOpen(false);

  // Закрытие меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Если меню открыто, и клик произошел НЕ по самому меню и НЕ по кнопке бургера
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.hamburger')
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Закрытие меню при изменении URL (например, нажали кнопку "Назад" в браузере)
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  // Блокировка скролла страницы, когда меню открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          GoPublica
        </Link>

        {/* Кнопка бургера. Обрати внимание, здесь крестик убран, он будет ВНУТРИ меню */}
        <button 
          className="hamburger" 
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Затемнение фона при открытом меню (Overlay) */}
        {isOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

        <div className={`navbar-menu ${isOpen ? 'active' : ''}`} ref={menuRef}>
          {/* Кнопка закрытия внутри самого меню (для мобилок) */}
          <button 
            className="menu-close-btn" 
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>

          <div className="navbar-links">
            <Link to="/" onClick={closeMenu}>{t('nav.home', 'Главная')}</Link>
            <Link to="/pricing" onClick={closeMenu}>{t('nav.pricing', 'Цены')}</Link>
            <Link to="/contact" onClick={closeMenu}>{t('nav.contact', 'Контакты')}</Link>
          </div>

          <div className="navbar-actions">
            <div className="lang-wrapper">
              <LanguageSelector />
            </div>
            {/* Логин и юзер-экшены удалены */}
          </div>
        </div>
      </div>
    </nav>
  );
}