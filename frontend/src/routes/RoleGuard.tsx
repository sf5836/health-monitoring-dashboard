
import { Navigate, Outlet } from 'react-router-dom';
import authService, { type AuthUser } from '../services/authService';

type RoleGuardProps = {
  allowedRoles: AuthUser['role'][];
  children?: React.ReactNode;
};

function fallbackPathForRole(role: AuthUser['role']): string {
  if (role === 'patient') return '/patient/dashboard';
  if (role === 'doctor') return '/doctor/dashboard';
  return '/admin/dashboard';
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const session = authService.getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(session.user.role)) {
    return <Navigate to={fallbackPathForRole(session.user.role)} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
