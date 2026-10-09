import { useMemo } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../../../processes/auth/model/session-store';
import { useSoftwareDetail, useSoftwareVersion } from '../../../entities/software/api/software.queries';
import { RouteLoading } from '../../../app/router/route-loading';
import {
  ROUTE_PATHS,
  softwareDetailsPath,
  softwareVersionDetailsPath,
} from '../../../app/router/route-paths';
import { UploadWorkspacePage } from '../../upload-workspace/ui/upload-workspace-page';
import SoftwareDetailsRoutePage from '../../software-details/ui/software-details-route-page';
import VersionDetailsRoutePage from '../../version-details/ui/version-details-route-page';
import PlansRoutePage from '../../plans/ui/plans-route-page';
import CheckoutRoutePage from '../../checkout/ui/checkout-route-page';
import AdminPage from '@/pages/admin/ui/admin-page';

type SoftwareLike = { id: string | number; name?: string } & Record<string, unknown>;
type VersionLike = { version: string } & Record<string, unknown>;

export function UploadWorkspaceRoute() {
  return <UploadWorkspacePage />;
}

export function SoftwareDetailsWorkspaceRoute() {
  const { softwareId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSessionStore((s) => s.user);
  const stateSoftware = (location.state as { software?: SoftwareLike } | null)?.software ?? null;
  const detailQuery = useSoftwareDetail(softwareId);
  const software = (detailQuery.data as SoftwareLike | undefined) ?? stateSoftware;
  const purchasedProjectIds = useMemo(() => [], []);

  if (!software && detailQuery.isLoading) {
    return <RouteLoading label="Loading software…" />;
  }

  return (
    <SoftwareDetailsRoutePage
      user={user}
      software={software}
      onBack={() => navigate(ROUTE_PATHS.workspaceSoftwares)}
      purchasedProjectIds={purchasedProjectIds}
      onOpenVersion={(item: SoftwareLike, version: VersionLike) =>
        navigate(softwareVersionDetailsPath(item.id, version.version), {
          state: { software: item, version },
        })
      }
      onCheckoutProject={(project: SoftwareLike) =>
        navigate(ROUTE_PATHS.workspaceCheckout, { state: { project } })
      }
    />
  );
}

export function VersionDetailsWorkspaceRoute() {
  const { softwareId, version } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSessionStore((s) => s.user);
  const stateSoftware = (location.state as { software?: SoftwareLike } | null)?.software ?? null;
  const stateVersion = (location.state as { version?: VersionLike } | null)?.version ?? null;
  const detailQuery = useSoftwareDetail(softwareId);
  const { versionData } = useSoftwareVersion(softwareId, version);
  const software = (detailQuery.data as SoftwareLike | undefined) ?? stateSoftware;
  const resolvedVersion = (versionData as VersionLike | null) ?? stateVersion;

  if (!software && detailQuery.isLoading) {
    return <RouteLoading label="Loading version…" />;
  }

  return (
    <VersionDetailsRoutePage
      user={user}
      software={software}
      version={resolvedVersion}
      onBack={() =>
        software?.id
          ? navigate(softwareDetailsPath(software.id))
          : navigate(ROUTE_PATHS.workspaceVersions)
      }
    />
  );
}

/** Redirect legacy state-carrying detail routes to their deep-linkable equivalents. */
export function LegacySoftwareDetailsRedirect() {
  const location = useLocation();
  const software = (location.state as { software?: SoftwareLike } | null)?.software;
  if (software?.id != null) {
    return <Navigate to={softwareDetailsPath(software.id)} state={location.state} replace />;
  }
  return <Navigate to={ROUTE_PATHS.workspaceSoftwares} replace />;
}

export function LegacyVersionDetailsRedirect() {
  const location = useLocation();
  const software = (location.state as { software?: SoftwareLike } | null)?.software;
  const version = (location.state as { version?: VersionLike } | null)?.version;
  if (software?.id != null && version?.version) {
    return (
      <Navigate
        to={softwareVersionDetailsPath(software.id, version.version)}
        state={location.state}
        replace
      />
    );
  }
  if (software?.id != null) {
    return <Navigate to={softwareDetailsPath(software.id)} replace />;
  }
  return <Navigate to={ROUTE_PATHS.workspaceVersions} replace />;
}

export function PlansWorkspaceRoute() {
  const navigate = useNavigate();
  return (
    <PlansRoutePage
      onBack={() => navigate(ROUTE_PATHS.workspaceSoftwares)}
      onSelectPlan={(plan: unknown) =>
        navigate(ROUTE_PATHS.workspaceCheckout, { state: { plan } })
      }
    />
  );
}

export function CheckoutWorkspaceRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSessionStore((s) => s.user);
  const selectedPlan = (location.state as { plan?: unknown } | null)?.plan ?? null;
  const selectedProject = (location.state as { project?: unknown } | null)?.project ?? null;

  return (
    <CheckoutRoutePage
      user={user}
      selectedPlan={selectedPlan}
      selectedProject={selectedProject}
      onBack={() => navigate(ROUTE_PATHS.workspaceSoftwares)}
      onComplete={() => navigate(ROUTE_PATHS.workspaceSoftwares)}
    />
  );
}

export function AdminWorkspaceRoute() {
  return <AdminPage />;
}
