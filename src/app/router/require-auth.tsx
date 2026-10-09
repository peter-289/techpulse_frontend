import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../processes/auth/model/session-store';
import { RouteLoading } from './route-loading';

export function RequireAuth() {
  const isLoggedIn = useSessionStore((s) => s.isLoggedIn);
  const isHydrated = useSessionStore((s) => s.isHydrated ?? true);
  const location = useLocation();

  if (!isHydrated) {
    return <RouteLoading label="Restoring your session…" />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
