import { ArrowUpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSoftwareVersionsFeed, type SoftwareVersionFeedItem } from '@/entities/software/api/software.queries';
import { Badge } from '@/shared/ui/badge/badge';
import { EmptyState, ErrorState, LoadingState, DataTable } from '@/shared/ui';
import {
  SectionCard,
  SectionPageHeader,
  StatCard,
  StatGrid,
} from './section-page';

type VersionStatus = 'Published' | 'In review' | 'Draft' | 'Yanked';

function toStatus(item: SoftwareVersionFeedItem): VersionStatus {
  const value = `${item.status} ${item.artifact_status ?? ''}`.toLowerCase();
  if (value.includes('revoke') || value.includes('yank') || value.includes('deprecat') || value.includes('archive') || value.includes('block')) {
    return 'Yanked';
  }
  if (value.includes('review') || value.includes('pending')) return 'In review';
  if (item.is_published || value.includes('publish') || value.includes('active')) return 'Published';
  return 'Draft';
}

function statusBadge(status: VersionStatus) {
  switch (status) {
    case 'Published':
      return <Badge variant="success">Published</Badge>;
    case 'In review':
      return <Badge variant="warning">In review</Badge>;
    case 'Draft':
      return <Badge variant="default">Draft</Badge>;
    case 'Yanked':
      return <Badge variant="danger">Yanked</Badge>;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function VersionsPage() {
  const query = useSoftwareVersionsFeed();
  const versions = query.data ?? [];

  const counts = versions.reduce(
    (acc, item) => {
      acc[toStatus(item)] += 1;
      return acc;
    },
    { Published: 0, 'In review': 0, Draft: 0, Yanked: 0 } as Record<VersionStatus, number>,
  );

  return (
    <div className="sec-page">
      <SectionPageHeader
        eyebrow="Distribution · Versions"
        title="Version Registry"
        description="Every release published to the TechPulse network, grouped by software and lifecycle stage."
        actions={
            <Link to="/workspace/upload-version" className="tp-btn tp-btn-primary">
            <ArrowUpCircle size={16} />
            Upload a version
          </Link>
        }
      />

      <StatGrid>
        <StatCard label="Published" value={counts.Published} helper="Available to subscribers" tone="success" />
        <StatCard label="In review" value={counts['In review']} helper="Awaiting security scan" tone="warning" />
        <StatCard label="Draft" value={counts.Draft} helper="Saved but unreleased" />
        <StatCard label="Yanked" value={counts.Yanked} helper="Withdrawn from distribution" tone="danger" />
      </StatGrid>

      <SectionCard
        title="All versions"
        subtitle="Newest releases first"
        actions={<Badge variant="info">{versions.length} records</Badge>}
      >
        {query.isLoading ? (
          <LoadingState label="Loading versions…" />
        ) : query.isError ? (
          <ErrorState message="We could not load the version registry." onRetry={() => query.refetch()} />
        ) : versions.length === 0 ? (
          <EmptyState title="No versions yet" message="Upload your first version to populate the registry." />
        ) : (
          <DataTable
            rows={versions}
            rowKey={(row) => `${row.software_id}-${row.version}`}
            columns={[
              { key: 'software', header: 'Software', className: 'muted', render: (row) => row.softwareName },
              {
                key: 'version',
                header: 'Version',
                className: 'sec-mono',
                render: (row) => (
                  <Link
                    to={`/workspace/software/${row.software_id}/versions/${encodeURIComponent(row.version)}`}
                  >
                    {row.version}
                  </Link>
                ),
              },
              { key: 'status', header: 'Status', render: (row) => statusBadge(toStatus(row)) },
              {
                key: 'released',
                header: 'Released',
                className: 'muted',
                render: (row) => formatDate(row.published_at || row.created_at),
              },
              {
                key: 'downloads',
                header: 'Downloads',
                className: 'muted',
                render: (row) => row.download_count.toLocaleString(),
              },
            ]}
          />
        )}
      </SectionCard>
    </div>
  );
}
