import { createBrowserRouter, Navigate } from 'react-router-dom';

// ── Layouts ───────────────────────────────────────────────────────────────
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout  from './components/layout/AdminLayout';

// ── Routing ───────────────────────────────────────────────────────────────
import ProtectedRoute from './components/routing/ProtectedRoute';

// ── Public Pages ──────────────────────────────────────────────────────────
import HomePage       from './pages/Public/Home/HomePage';
import CalculatorPage from './pages/Public/CalculatorPage/CalculatorPage';
import ContactPage    from './pages/Public/ContactPage/ContactPage';
import LoginPage      from './pages/Public/LoginPage/LoginPage';
import ProfilePage    from './pages/Public/ProfilePage/ProfilePage';

// ── Admin Pages ───────────────────────────────────────────────────────────
import DashboardPage    from './pages/Admin/Dashboard/Dashboard';
import LeadsCRMPage     from './pages/Admin/LeadsCRMPage/LeadsCRMPage';
import ClientsPage      from './pages/Admin/ClientsPage/ClientsPage';
import ClientDetailPage from './pages/Admin/ClientDetailPage/ClientDetailPage';
import RequestsPage     from './pages/Admin/RequestsPage/RequestsPage';
import PortfolioCMSPage from './pages/Admin/PortfolioCMSPage/PortfolioCMSPage';
import ProjectsPage     from './pages/Admin/ProjectsPage/ProjectsPage';
import MyProfilePage from './pages/Admin/MyProfilePage/MyProfilePage';

const router = createBrowserRouter([

  // ── Страница логина (без layout) ────────────────────────────────────────
  { path: 'login', element: <LoginPage /> },

  // ── Публичная зона (с хэдером сайта) ────────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      { index: true,        element: <HomePage /> },
      { path: 'calculator', element: <CalculatorPage /> },
      { path: 'contact',    element: <ContactPage /> },

      // Профиль — с хэдером, но только для авторизованных
      {
        element: <ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']} />,
        children: [
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },

  // ── Админ-зона (боковое меню, только admin/superadmin) ───────────────────
  {
    path: 'admin',
    element: <ProtectedRoute allowedRoles={['admin', 'superadmin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true,           element: <DashboardPage /> },
          { path: 'leads',         element: <LeadsCRMPage /> },
          { path: 'clients',       element: <ClientsPage /> },
          { path: 'clients/:id',   element: <ClientDetailPage /> },
          { path: 'requests',      element: <RequestsPage /> },
          { path: 'portfolio',     element: <PortfolioCMSPage /> },
          { path: 'projects',      element: <ProjectsPage /> },
          { path: 'profile', element: <MyProfilePage /> },
        ],
      },
    ],
  },

  // ── 404 → главная ────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },

]);

export default router;