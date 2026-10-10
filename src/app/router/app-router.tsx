import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { WorkspaceShell } from '../../widgets/workspace-shell/ui/workspace-shell';
import { RequireAuth } from './require-auth';
import { RequireRole } from './require-role';
import { RouteErrorBoundary } from './route-error-boundary';
import { RouteLoading } from './route-loading';
import { ROUTE_PATHS } from './route-paths';
import { httpClient } from '@/shared/api/http-client';
import { useSessionStore } from '../../processes/auth/model/session-store';
import { VersionsPage } from '../../pages/workspace-sections/ui/versions-page';
import { ArtifactsPage } from '../../pages/workspace-sections/ui/artifacts-page';
import { SecurityPage } from '../../pages/workspace-sections/ui/security-page';
import { AuditPage } from '../../pages/workspace-sections/ui/audit-page';
import { AnalyticsPage } from '../../pages/workspace-sections/ui/analytics-page';
import { SettingsPage } from '../../pages/workspace-sections/ui/settings-page';
import { UploadWorkspaceRoute } from '../../pages/upload-workspace/ui/upload-workspace-route';
import { UploadVersionPage } from '../../pages/upload-version/ui/upload-version-page';
import { SoftwareRegistryPage } from '../../pages/software-registry/ui/software-registry-page';

const WorkspaceOverviewPage = lazy(() => import('../../pages/workspace-overview/ui/workspace-overview-page').then((m) => ({ default: m.WorkspaceOverviewPage })));
const LandingRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.LandingRoute })));
const RegisterRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.RegisterRoute })));
const LoginRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.LoginRoute })));
const ForgotPasswordRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.ForgotPasswordRoute })));
const CheckEmailRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.CheckEmailRoute })));
const PasswordResetRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.PasswordResetRoute })));
const EmailVerificationRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.EmailVerificationRoute })));
const SoftwareDetailsWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.SoftwareDetailsWorkspaceRoute })));
const VersionDetailsWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.VersionDetailsWorkspaceRoute })));
const LegacySoftwareDetailsRedirect = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.LegacySoftwareDetailsRedirect })));
const LegacyVersionDetailsRedirect = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.LegacyVersionDetailsRedirect })));
const PlansWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.PlansWorkspaceRoute })));
const CheckoutWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.CheckoutWorkspaceRoute })));
const AdminWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.AdminWorkspaceRoute })));

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{node}</Suspense>;
}

function SessionBootstrap() {
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  useEffect(() => {
    let mounted = true;
    const { setHydrated } = useSessionStore.getState();
    setHydrated(false);
    httpClient
      .get('/api/v1/users/me')
      .then((res) => {
        if (mounted) setSession(res.data || null);
      })
      .catch(() => {
        if (mounted) clearSession();
      })
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, [setSession, clearSession]);

  return null;
}

function RootLayout() {
  return (
    <>
      <SessionBootstrap />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: ROUTE_PATHS.landing, element: withSuspense(<LandingRoute />) },
      { path: ROUTE_PATHS.register, element: withSuspense(<RegisterRoute />) },
      { path: ROUTE_PATHS.login, element: withSuspense(<LoginRoute />) },
      { path: ROUTE_PATHS.forgotPassword, element: withSuspense(<ForgotPasswordRoute />) },
      { path: ROUTE_PATHS.checkEmail, element: withSuspense(<CheckEmailRoute />) },
      { path: ROUTE_PATHS.passwordReset, element: withSuspense(<PasswordResetRoute />) },
      { path: ROUTE_PATHS.emailVerification, element: withSuspense(<EmailVerificationRoute />) },

      {
        element: <RequireAuth />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            element: <WorkspaceShell />,
            errorElement: <RouteErrorBoundary />,
            children: [
              { path: ROUTE_PATHS.workspaceOverview, element: withSuspense(<WorkspaceOverviewPage />) },
              { path: ROUTE_PATHS.workspaceSoftwares, element: withSuspense(<SoftwareRegistryPage scope="my-software" />) },
              { path: ROUTE_PATHS.workspaceDiscover, element: withSuspense(<SoftwareRegistryPage scope="discover" />) },
              { path: ROUTE_PATHS.workspaceUploadSoftware, element: withSuspense(<UploadWorkspaceRoute />) },
              { path: ROUTE_PATHS.workspaceUploadVersion, element: withSuspense(<UploadVersionPage />) },
              { path: ROUTE_PATHS.workspaceVersions, element: withSuspense(<VersionsPage />) },
              { path: ROUTE_PATHS.workspaceArtifacts, element: withSuspense(<ArtifactsPage />) },
              { path: ROUTE_PATHS.workspaceSecurity, element: withSuspense(<SecurityPage />) },
              { path: ROUTE_PATHS.workspaceAudit, element: withSuspense(<AuditPage />) },
              { path: ROUTE_PATHS.workspaceAnalytics, element: withSuspense(<AnalyticsPage />) },
              { path: ROUTE_PATHS.workspaceSettings, element: withSuspense(<SettingsPage />) },

              { path: ROUTE_PATHS.softwareDetails, element: withSuspense(<SoftwareDetailsWorkspaceRoute />) },
              { path: ROUTE_PATHS.softwareVersionDetails, element: withSuspense(<VersionDetailsWorkspaceRoute />) },
              { path: ROUTE_PATHS.workspacePlans, element: withSuspense(<PlansWorkspaceRoute />) },
              { path: ROUTE_PATHS.workspaceCheckout, element: withSuspense(<CheckoutWorkspaceRoute />) },
              {
                path: ROUTE_PATHS.workspaceAdmin,
                element: (
                  <RequireRole requiredRole="admin">{withSuspense(<AdminWorkspaceRoute />)}</RequireRole>
                ),
              },
            ],
          },
        ],
      },

      { path: ROUTE_PATHS.legacySoftwareDetails, element: withSuspense(<LegacySoftwareDetailsRedirect />) },
      { path: ROUTE_PATHS.legacyVersionDetails, element: withSuspense(<LegacyVersionDetailsRedirect />) },
      { path: '/workspace', element: <Navigate to={ROUTE_PATHS.workspaceOverview} replace /> },
      { path: '/workspace/software-registry', element: <Navigate to={ROUTE_PATHS.workspaceSoftwares} replace /> },
      { path: '/workspace/software-library', element: <Navigate to={ROUTE_PATHS.workspaceDiscover} replace /> },
      { path: '/workspace/resources', element: <Navigate to={ROUTE_PATHS.workspaceOverview} replace /> },
      { path: '*', element: <Navigate to={ROUTE_PATHS.landing} replace /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
