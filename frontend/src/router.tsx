import { createBrowserRouter, Navigate } from 'react-router-dom';

// --- Layouts ---
import PublicLayout  from './components/layout/PublicLayout';
import AdminLayout   from './components/layout/AdminLayout';

// --- Routing ---
import ProtectedRoute from './components/routing/ProtectedRoute';

// --- Public Pages ---
import HomePage          from './pages/Public/Home/HomePage';
import CalculatorPage    from './pages/Public/CalculatorPage/CalculatorPage';
import ContactPage       from './pages/Public/ContactPage/ContactPage';
import LoginPage         from './pages/Public/LoginPage/LoginPage';
import ProfilePage       from './pages/Public/ProfilePage/ProfilePage';

// --- Admin Pages ---
import DashboardPage     from './pages/Admin/Dashboard/Dashboard';
import LeadsCRMPage      from './pages/Admin/LeadsCRMPage/LeadsCRMPage';
import PortfolioCMSPage  from './pages/Admin/PortfolioCMSPage/PortfolioCMSPage';
import ProjectsPage      from './pages/Admin/ProjectsPage/ProjectsPage';

const router = createBrowserRouter([
  // ── Страница логина (без layout) ─────────────────────────────────────────
  { path: 'login', element: <LoginPage /> },

  // ── Зона с публичным Layout (Хэдер сайта) ────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      // Абсолютно открытые страницы
      { index: true,          element: <HomePage /> },
      { path: 'calculator',   element: <CalculatorPage /> },
      { path: 'contact',      element: <ContactPage /> },
      
      // Страница профиля (С хэдером сайта, но доступна только авторизованным)
      {
        element: <ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']} />,
        children: [
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },

  // ── Строгая Админ-зона (С боковым меню) ──────────────────────────────────
  {
    path: 'admin',
    // СЮДА ПУСКАЕМ ТОЛЬКО АДМИНОВ!
    element: <ProtectedRoute allowedRoles={['admin', 'superadmin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true,        element: <DashboardPage /> },
          { path: 'leads',      element: <LeadsCRMPage /> },
          { path: 'portfolio',  element: <PortfolioCMSPage /> },
          { path: 'projects',   element: <ProjectsPage /> },
        ],
      },
    ],
  },

  // ── Перехват неизвестных ссылок (404) ────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;