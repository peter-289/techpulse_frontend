import { Boxes } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '@/app/router/route-paths';
import { useArtifacts } from '@/entities/artifact/api/artifact.queries';
import { classifyScanStatus } from '@/entities/security/model/security.schema';
import { Badge } from '@/shared/ui/badge/badge';
import { EmptyState, ErrorState, LoadingState, DataTable } from '@/shared/ui';
import {
  SectionCard,
  SectionNote,
  SectionPageHeader,
  StatCard,
  StatGrid,
} from './section-page';

function scanState(value: string) {
  switch (classifyScanStatus(value)) {
    case 'clean':
      return { label: 'Verified', variant: 'success' as const };
    case 'pending':
      return { label: 'Scanning', variant: 'warning' as const };
    case 'threat':
      return { label: 'Blocked', variant: 'danger' as const };
    default:
      return { label: 'Unknown', variant: 'default' as const };
  }
}

function formatSize(bytes: number | null) {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

export function ArtifactsPage() {
  const query = useArtifacts();
  const artifacts = query.data ?? [];

  const counts = artifacts.reduce(
    (acc, item) => {
      const label = scanState(item.scanStatus).label as 'Verified' | 'Scanning' | 'Blocked' | 'Unknown';
      acc[label] += 1;
      return acc;
    },
    { Verified: 0, Scanning: 0, Blocked: 0, Unknown: 0 } as Record<
      'Verified' | 'Scanning' | 'Blocked' | 'Unknown',
      number
    >,
  );

  return (
    <div className="sec-page">
      <SectionPageHeader
        eyebrow="Distribution · Artifacts"
        title="Artifact Explorer"
        description="The raw installable files that make up every release, with integrity and scan status."
      />

      <StatGrid>
        <StatCard label="Artifacts" value={artifacts.length} helper="Across all versions" />
        <StatCard label="Verified" value={counts.Verified} helper="Integrity checksum passed" tone="success" />
        <StatCard label="Scanning" value={counts.Scanning} helper="Queued for analysis" tone="warning" />
        <StatCard label="Blocked" value={counts.Blocked} helper="Held by the security layer" tone="danger" />
      </StatGrid>

      <SectionNote icon={<Boxes size={16} />}>
        <p>
          <strong>How artifacts work.</strong> Each upload is unpacked, hashed and scanned before it
          can be distributed. Files never reach subscribers while their scan is pending. See the{' '}
          <Link to={ROUTE_PATHS.workspaceSecurity}>Security Center</Link> for the full breakdown.
        </p>
      </SectionNote>

      <SectionCard
        title="Recent artifacts"
        subtitle="Files from the last 30 days"
        actions={<Badge variant="info">{artifacts.length} files</Badge>}
      >
        {query.isLoading ? (
          <LoadingState label="Loading artifacts…" />
        ) : query.isError ? (
          <ErrorState message="We could not load artifacts." onRetry={() => query.refetch()} />
        ) : artifacts.length === 0 ? (
          <EmptyState title="No artifacts yet" message="Artifacts appear here once a version is uploaded." />
        ) : (
          <DataTable
            rows={artifacts}
            columns={[
              { key: 'file', header: 'File', className: 'sec-mono', render: (row) => row.fileName },
              { key: 'software', header: 'Software', className: 'muted', render: (row) => row.softwareName },
              { key: 'version', header: 'Version', className: 'sec-mono', render: (row) => row.version },
              { key: 'size', header: 'Size', className: 'muted', render: (row) => formatSize(row.sizeBytes) },
              {
                key: 'sha',
                header: 'SHA-256',
                className: 'sec-mono muted',
                render: (row) =>
                  row.sha256 ? `${row.sha256.slice(0, 4)}…${row.sha256.slice(-4)}` : '—',
              },
              {
                key: 'scan',
                header: 'Scan',
                render: (row) => {
                  const state = scanState(row.scanStatus);
                  return <Badge variant={state.variant}>{state.label}</Badge>;
                },
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}
