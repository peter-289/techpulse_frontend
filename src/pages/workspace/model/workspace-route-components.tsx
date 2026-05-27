import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../../API_Wrapper';
import { useSessionStore } from '../../../processes/auth/model/session-store';
import { UploadWorkspacePage } from '../../upload-workspace/ui/upload-workspace-page';
import SoftwareDetailsRoutePage from '../../software-details/ui/software-details-route-page';
import VersionDetailsRoutePage from '../../version-details/ui/version-details-route-page';
import PlansRoutePage from '../../plans/ui/plans-route-page';
import CheckoutRoutePage from '../../checkout/ui/checkout-route-page';
import { AdminWorkspacePage } from '../../admin-workspace/ui/admin-workspace-page';

function useWorkspaceRouteContext() {
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user) as any;
  const clearSession = useSessionStore((s) => s.clearSession);

  const onLogout = async () => {
    try {
      await authApi.post('/api/v1/auth/logout');
    } catch {}
    clearSession();
    navigate('/');
  };

  const onNavigate = (target: string) => {
    const map: Record<string, string> = {
      resources: '/workspace/resources',
      projects: '/workspace/projects',
      upload_project: '/workspace/upload-project',
      plans: '/workspace/plans',
      admin: '/workspace/admin',
    };
    if (target === 'support_ai' || target === 'developers' || target === 'api_docs' || target === 'kb' || target === 'settings') return;
    navigate(map[target] || '/workspace/resources');
  };

  return { navigate, user, onLogout, onNavigate };
}

export function UploadWorkspaceRoute() {
  const { user, onNavigate, onLogout } = useWorkspaceRouteContext();
  return <UploadWorkspacePage user={user} onNavigate={onNavigate} onLogout={onLogout} />;
}

export function SoftwareDetailsWorkspaceRoute() {
  const location = useLocation();
  const { navigate, user, onNavigate, onLogout } = useWorkspaceRouteContext();
  const software = (location.state as any)?.software || null;
  const purchasedProjectIds = useMemo(() => [], []);

  return (
    <SoftwareDetailsRoutePage
      user={user}
      software={software}
      onBack={() => navigate('/workspace/projects')}
      onLogout={onLogout}
      onNavigate={onNavigate}
      purchasedProjectIds={purchasedProjectIds}
      onOpenVersion={(item: any, version: any) => navigate('/workspace/version-details', { state: { software: item, version } })}
      onCheckoutProject={(project: any) => navigate('/workspace/checkout', { state: { project } })}
    />
  );
}

export function VersionDetailsWorkspaceRoute() {
  const location = useLocation();
  const { navigate, user, onNavigate, onLogout } = useWorkspaceRouteContext();
  const software = (location.state as any)?.software || null;
  const version = (location.state as any)?.version || null;

  return (
    <VersionDetailsRoutePage
      user={user}
      software={software}
      version={version}
      onBack={() => navigate('/workspace/software-details', { state: { software } })}
      onLogout={onLogout}
      onNavigate={onNavigate}
    />
  );
}

export function PlansWorkspaceRoute() {
  const { navigate, user, onNavigate, onLogout } = useWorkspaceRouteContext();
  return (
    <PlansRoutePage
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
      onBack={() => navigate('/workspace/projects')}
      onSelectPlan={(plan: any) => navigate('/workspace/checkout', { state: { plan } })}
    />
  );
}

export function CheckoutWorkspaceRoute() {
  const location = useLocation();
  const { navigate, user, onNavigate, onLogout } = useWorkspaceRouteContext();
  const selectedPlan = (location.state as any)?.plan || null;
  const selectedProject = (location.state as any)?.project || null;

  return (
    <CheckoutRoutePage
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
      selectedPlan={selectedPlan}
      selectedProject={selectedProject}
      onBack={() => navigate('/workspace/projects')}
      onComplete={() => navigate('/workspace/projects')}
    />
  );
}

export function AdminWorkspaceRoute() {
  const { navigate, user, onNavigate } = useWorkspaceRouteContext();
  return <AdminWorkspacePage user={user} onBack={() => navigate('/workspace/resources')} onNavigate={onNavigate} />;
}
