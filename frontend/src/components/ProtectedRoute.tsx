import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from './layout/MainLayout';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').trim().toLowerCase();
    // Super Admin and Admin are treated as equivalent
    const normalizedUserRoles = (userRole === 'super admin' || userRole === 'admin')
      ? ['admin', 'super admin']
      : [userRole];

    const hasAccess = allowedRoles.some(allowed => 
      normalizedUserRoles.includes(allowed.trim().toLowerCase())
    );

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
