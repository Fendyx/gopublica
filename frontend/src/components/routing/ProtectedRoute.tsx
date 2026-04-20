import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/store';

interface ProtectedRouteProps {
  allowedRoles?: Array<'user' | 'admin' | 'superadmin'>;
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { token, user } = useAuthStore();

  // Если нет токена - выкидываем на логин
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Если роли юзера нет в списке разрешенных для этого роута - выкидываем на главную
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    alert('У вас нет доступа к этой панели. Ожидайте повышения прав.');
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}