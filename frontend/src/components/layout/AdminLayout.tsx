import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/store'; // Подключаем стор
import './AdminLayout.css'; // Подключаем CSS для адаптивности

const NAV_ITEMS = [
  { to: '/admin',        label: 'Дашборд',    icon: '▦', end: true  },
  { to: '/admin/leads',  label: 'Лиды (CRM)', icon: '◈', end: false },
  { to: '/admin/portfolio', label: 'Портфолио', icon: '◉', end: false },
  { to: '/admin/projects',  label: 'Проекты',   icon: '◎', end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleBackToSite = () => {
    navigate('/');
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      
      {/* Темный фон при открытом меню на мобилке */}
      <div 
        className={`admin-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={closeSidebar}
      ></div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div>
            <div className="admin-logo-title">GoPublica</div>
            <div className="admin-logo-subtitle">Admin Panel</div>
          </div>
          {/* Кнопка закрытия внутри сайдбара для мобилок */}
          <button className="admin-close-btn" onClick={closeSidebar}>✕</button>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              onClick={closeSidebar}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{icon}</span> {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-name">
            {user?.name || 'Пользователь'}
          </div>
          <button onClick={handleBackToSite} className="admin-back-btn">
            ← На сайт
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Кнопка открытия сайдбара (бургер) */}
            <button className="admin-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              ☰
            </button>
            <span className="admin-header-title">Панель управления</span>
          </div>
          
          <span className="admin-role-badge">
            role: <strong>{user?.role}</strong>
          </span>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}