import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/store';
import { ThemeToggle } from '../shared/ThemeToggle';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin',           label: 'Dashboard',        icon: '▦', end: true  },
  { to: '/admin/leads',     label: 'Leads CRM',        icon: '◈', end: false },
  { to: '/admin/clients',   label: 'Clients',          icon: '◉', end: false },
  { to: '/admin/requests',  label: 'Change Requests',  icon: '✎', end: false },
  { to: '/admin/portfolio', label: 'Portfolio',        icon: '◎', end: false },
  { to: '/admin/projects',  label: 'Projects',         icon: '◫', end: false },
  { to: '/admin/profile',   label: 'My Profile',       icon: '◑', end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="admin-layout">
      {/* Overlay для мобильного меню */}
      <div
        className={`admin-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo-wrapper">
            <div className="admin-logo-title">GoPublica</div>
            <div className="admin-logo-subtitle">Admin Panel</div>
          </div>
          <button className="admin-close-btn" onClick={closeSidebar} aria-label="Close menu">✕</button>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeSidebar}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="admin-nav-icon" aria-hidden="true">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-name">{user?.name || 'User'}</div>
          <button onClick={() => navigate('/')} className="admin-back-btn">
            ← Back to site
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
              ☰
            </button>
            <span className="admin-header-title">Admin Panel</span>
          </div>
          
          <div className="admin-header-right">
            <ThemeToggle />
            <span className="admin-role-badge">
              role: <strong>{user?.role}</strong>
            </span>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}