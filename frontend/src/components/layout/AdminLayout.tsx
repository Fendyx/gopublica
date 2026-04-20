import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/store'; // Подключаем стор

const NAV_ITEMS = [
  { to: '/admin',        label: 'Дашборд',    icon: '▦', end: true  },
  { to: '/admin/leads',  label: 'Лиды (CRM)', icon: '◈', end: false },
  { to: '/admin/portfolio', label: 'Портфолио', icon: '◉', end: false },
  { to: '/admin/projects',  label: 'Проекты',   icon: '◎', end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // Достаем только данные юзера (logout больше не нужен)

  // Просто возвращаемся на публичную часть сайта
  const handleBackToSite = () => {
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width, 250px)',
        background: 'var(--color-sidebar-bg, #1e1e2f)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>GoPublica</div>
          <div style={{ fontSize: '12px', color: 'var(--color-sidebar-text, gray)', marginTop: 2 }}>Admin Panel</div>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '6px', marginBottom: '2px',
                fontSize: '14px', textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--color-sidebar-text, gray)',
                background: isActive ? 'var(--color-sidebar-active, rgba(255,255,255,0.1))' : 'transparent',
                fontWeight: isActive ? 600 : 400, transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: '16px' }}>{icon}</span> {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '13px' }}>
          {/* Динамическое имя */}
          <div style={{ marginBottom: '4px', fontWeight: 500, color: '#fff' }}>
            {user?.name || 'Пользователь'}
          </div>
          <button
            onClick={handleBackToSite}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              color: 'var(--color-sidebar-text, gray)', padding: '6px 12px',
              fontSize: '12px', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px'
            }}
          >
            ← На сайт
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: '56px', padding: '0 32px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--color-bg)', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Панель управления</span>
          {/* Динамическая роль */}
          <span style={{
            fontSize: '12px', background: 'var(--color-surface)',
            border: '1px solid var(--color-border)', borderRadius: '999px',
            padding: '4px 12px', color: 'var(--color-text-muted)',
          }}>
            role: <strong style={{ color: user?.role === 'superadmin' ? '#7c3aed' : 'black' }}>{user?.role}</strong>
          </span>
        </header>

        <main style={{ flex: 1, padding: '32px', background: 'var(--color-surface)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}