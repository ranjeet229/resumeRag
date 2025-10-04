import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { RoutePath } from './types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

/**
 * Protected route component that handles authentication and role-based access
 */
export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={RoutePath.LOGIN} state={{ from: location }} replace />;
  }

  // Check if route requires specific roles
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some(role => user?.roles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to={RoutePath.DASHBOARD} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Public route component that redirects authenticated users
 */
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || RoutePath.DASHBOARD;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};