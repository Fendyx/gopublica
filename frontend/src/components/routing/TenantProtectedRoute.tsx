import { Navigate, Outlet } from 'react-router-dom';
import { useTenantAuthStore } from '../../store/tenantAuthStore';

export default function TenantProtectedRoute() {
  const token = useTenantAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login-client" replace />;
  return <Outlet />;
}