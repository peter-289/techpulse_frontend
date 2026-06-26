import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../../widgets/app-shell/ui/app-shell';
import { RequireAuth } from './require-auth';
import { authApi } from '../../API_Wrapper';
import { useSessionStore } from '../../processes/auth/model/session-store';

const SoftwareRegistryPage = lazy(() => import('../../pages/software-registry/ui/software-registry-page').then((m) => ({ default: m.SoftwareRegistryPage })));
const WorkspaceOverviewPage = lazy(() => import('../../pages/workspace-overview/ui/workspace-overview-page').then((m) => ({ default: m.WorkspaceOverviewPage })));
const ProjectLibraryPage = lazy(() => import('../../pages/project-library/ui/project-library-page').then((m) => ({ default: m.ProjectLibraryPage })));
const LandingRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.LandingRoute })));
const RegisterRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.RegisterRoute })));
const LoginRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.LoginRoute })));
const ForgotPasswordRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.ForgotPasswordRoute })));
const CheckEmailRoute = lazy(() => import('../../pages/auth/model/auth-route-components').then((m) => ({ default: m.CheckEmailRoute })));
const UploadWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.UploadWorkspaceRoute })));
const SoftwareDetailsWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.SoftwareDetailsWorkspaceRoute })));
const VersionDetailsWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.VersionDetailsWorkspaceRoute })));
const PlansWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.PlansWorkspaceRoute })));
const CheckoutWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.CheckoutWorkspaceRoute })));
const AdminWorkspaceRoute = lazy(() => import('../../pages/workspace/model/workspace-route-components').then((m) => ({ default: m.AdminWorkspaceRoute })));

function SessionBootstrap() {
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  useEffect(() => {
    let mounted = true;
    authApi
      .get('/api/v1/users/me')
      .then((res) => {
        if (mounted) setSession(res.data || null);
      })
      .catch(() => {
        if (mounted) clearSession();
      });
    return () => {
      mounted = false;
    };
  }, [setSession, clearSession]);

  return null;
}

export function AppRouter() {
  const fallback = <div className="p-4 text-sm text-stone-300">Loading route...</div>;
  return (
    <BrowserRouter>
      <SessionBootstrap />
      <Routes>
        <Route path="/" element={<Suspense fallback={fallback}><LandingRoute /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={fallback}><RegisterRoute /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={fallback}><LoginRoute /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={fallback}><ForgotPasswordRoute /></Suspense>} />
        <Route path="/check-email" element={<Suspense fallback={fallback}><CheckEmailRoute /></Suspense>} />

        <Route element={<RequireAuth />}>
          <Route path="/workspace/upload-project" element={<Suspense fallback={fallback}><UploadWorkspaceRoute /></Suspense>} />
          <Route path="/workspace/software-details" element={<Suspense fallback={fallback}><SoftwareDetailsWorkspaceRoute /></Suspense>} />
          <Route path="/workspace/version-details" element={<Suspense fallback={fallback}><VersionDetailsWorkspaceRoute /></Suspense>} />
          <Route path="/workspace/plans" element={<Suspense fallback={fallback}><PlansWorkspaceRoute /></Suspense>} />
          <Route path="/workspace/checkout" element={<Suspense fallback={fallback}><CheckoutWorkspaceRoute /></Suspense>} />
          <Route path="/workspace/admin" element={<Suspense fallback={fallback}><AdminWorkspaceRoute /></Suspense>} />
        </Route>

        <Route path="/workspace" element={<Navigate to="/workspace/overview" replace />} />
        <Route
          path="/workspace/resources"
          element={(
            <AppShell>
              <Suspense fallback={fallback}><WorkspaceOverviewPage /></Suspense>
            </AppShell>
          )}
        />
        <Route
          path="/workspace/projects"
          element={(
            <AppShell>
              <Suspense fallback={fallback}><ProjectLibraryPage /></Suspense>
            </AppShell>
          )}
        />
        <Route
          path="/workspace/overview"
          element={(
            <AppShell>
              <Suspense fallback={fallback}><WorkspaceOverviewPage /></Suspense>
            </AppShell>
          )}
        />
        <Route
          path="/workspace/software-registry"
          element={(
            <AppShell>
              <Suspense fallback={fallback}><SoftwareRegistryPage /></Suspense>
            </AppShell>
          )}
        />
        <Route
          path="/workspace/project-library"
          element={(
            <AppShell>
              <Suspense fallback={fallback}><ProjectLibraryPage /></Suspense>
            </AppShell>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
