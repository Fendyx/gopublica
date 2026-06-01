import { createBrowserRouter, Navigate } from 'react-router-dom';

import PublicLayout from './components/layout/PublicLayout';
import AdminLayout  from './components/layout/AdminLayout';

import ProtectedRoute       from './components/routing/ProtectedRoute';
import TenantProtectedRoute from './components/routing/TenantProtectedRoute';

// Public
import HomePage         from './pages/Public/Home/HomePage';
import CalculatorPage   from './pages/Public/CalculatorPage/CalculatorPage';
import ContactPage      from './pages/Public/ContactPage/ContactPage';
import LoginPage        from './pages/Public/LoginPage/LoginPage';
import PricingPage      from './pages/Public/PricingPage/PricingPage';
import RegisterPage     from './pages/Public/RegisterPage/RegisterPage';
import ClientLoginPage  from './pages/Public/ClientLoginPage/ClientLoginPage';
import DashboardPage    from './pages/Public/DashboardPage/DashboardPage';
import SubscribePage from './pages/Public/SubscribePage/SubscribePage';

// Admin (внутренняя CRM)
import DashboardAdmin   from './pages/Admin/Dashboard/Dashboard';
import LeadsCRMPage     from './pages/Admin/LeadsCRMPage/LeadsCRMPage';
import ClientsPage      from './pages/Admin/ClientsPage/ClientsPage';
import ClientDetailPage from './pages/Admin/ClientDetailPage/ClientDetailPage';
import RequestsPage     from './pages/Admin/RequestsPage/RequestsPage';
import PortfolioCMSPage from './pages/Admin/PortfolioCMSPage/PortfolioCMSPage';
import ProjectsPage     from './pages/Admin/ProjectsPage/ProjectsPage';
import MyProfilePage    from './pages/Admin/MyProfilePage/MyProfilePage';
import NewslettersPage  from './pages/Admin/NewslettersPage/NewslettersPage';

const router = createBrowserRouter([

  // Страница входа для внутренней CRM (без layout)
  { path: 'login', element: <LoginPage /> },

  // Вход и регистрация для клиентов (без layout)
  { path: 'login-client', element: <ClientLoginPage /> },
  { path: 'register',     element: <RegisterPage /> },

  // Публичная зона
  {
    element: <PublicLayout />,
    children: [
      { index: true,        element: <HomePage /> },
      { path: 'calculator', element: <CalculatorPage /> },
      { path: 'contact',    element: <ContactPage /> },
      { path: 'pricing',    element: <PricingPage /> },
    ],
  },

  // Личный кабинет клиента (только для авторизованных tenant users)
  {
    element: <TenantProtectedRoute />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'subscribe', element: <SubscribePage /> },
    ],
  },

  // Внутренняя CRM (admin/superadmin)
  {
    path: 'admin',
    element: <ProtectedRoute allowedRoles={['admin', 'superadmin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true,         element: <DashboardAdmin /> },
          { path: 'leads',       element: <LeadsCRMPage /> },
          { path: 'clients',     element: <ClientsPage /> },
          { path: 'clients/:id', element: <ClientDetailPage /> },
          { path: 'requests',    element: <RequestsPage /> },
          { path: 'portfolio',   element: <PortfolioCMSPage /> },
          { path: 'projects',    element: <ProjectsPage /> },
          { path: 'profile',     element: <MyProfilePage /> },
          { path: 'newsletters', element: <NewslettersPage /> },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;