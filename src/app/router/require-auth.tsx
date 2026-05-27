import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../processes/auth/model/session-store';

export function RequireAuth() {
  const isLoggedIn = useSessionStore((s) => s.isLoggedIn);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
