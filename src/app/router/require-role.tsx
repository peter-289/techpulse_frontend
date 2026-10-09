import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../processes/auth/model/session-store';

/**
 * Role gate for routes that require an elevated session.
 * Redirects non-matching sessions back to the workspace with the
 * attempted path preserved so callers can respond after login.
 */
export function RequireRole({ requiredRole, children }: { requiredRole: string; children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const location = useLocation();
  const currentRole = String((user as { role?: unknown } | null)?.role || '').toLowerCase();

  if (currentRole !== requiredRole.toLowerCase()) {
    return <Navigate to="/workspace/overview" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
