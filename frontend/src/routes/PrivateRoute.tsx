
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../services/authService';

type PrivateRouteProps = {
  children?: React.ReactNode;
  redirectTo?: string;
};

export default function PrivateRoute({ children, redirectTo = '/login' }: PrivateRouteProps) {
  const location = useLocation();
  const session = authService.getSession();

  if (!session) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return children ? <>{children}</> : <Outlet />;
}
