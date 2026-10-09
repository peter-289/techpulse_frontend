import { TrendingUp } from 'lucide-react';
import { useAnalytics } from '@/entities/analytics/api/analytics.queries';
import { Badge } from '@/shared/ui/badge/badge';
import { EmptyState, ErrorState, LoadingState, DataTable } from '@/shared/ui';
import {
  SectionCard,
  SectionPageHeader,
  StatCard,
  StatGrid,
} from './section-page';

export function AnalyticsPage() {
  const query = useAnalytics();
  const data = query.data;
  const bars = data?.series ?? [];
  const topSoftware = data?.topSoftware ?? [];
  const maxDownloads = bars.reduce((max, bar) => (bar.value > max ? bar.value : max), 1);

  return (
    <div className="sec-page">
      <SectionPageHeader
        eyebrow="Distribution · Analytics"
        title="Analytics"
        description="Download trends and catalog performance across the TechPulse network, updated in real time."
      />

      {query.isLoading ? (
        <LoadingState label="Loading analytics…" />
      ) : query.isError ? (
        <ErrorState message="We could not load analytics." onRetry={() => query.refetch()} />
      ) : (
        <>
          <StatGrid>
            <StatCard
              label="Downloads"
              value={(data?.totalDownloads ?? 0).toLocaleString()}
              helper="Across all software"
              tone="success"
            />
            <StatCard label="Active software" value={data?.activeSoftware ?? 0} helper="Published and served" />
            <StatCard label="Catalogue size" value={data?.totalSoftware ?? 0} helper="Total software items" />
            <StatCard
              label="Avg scan time"
              value={data?.avgScanSeconds != null ? `${data.avgScanSeconds} s` : '—'}
              helper="Per artifact analysis"
            />
          </StatGrid>

          <SectionCard
            title="Downloads"
            subtitle="Last 12 days across all software"
            actions={
              <Badge variant="success">
                <TrendingUp size={12} /> Live
              </Badge>
            }
          >
            {bars.length === 0 ? (
              <EmptyState title="No download data" message="Trends appear once your software is downloaded." />
            ) : (
              <>
                <div className="sec-bars" role="img" aria-label="Bar chart of daily downloads over the last 12 days">
                  {bars.map((bar) => (
                    <div
                      key={bar.day}
                      className="sec-bar"
                      style={{ height: `${Math.max(6, (bar.value / maxDownloads) * 100)}%` }}
                      title={`${bar.label}: ${bar.value} downloads`}
                    />
                  ))}
                </div>
                <div className="sec-bar-labels">
                  {bars.map((bar) => (
                    <span key={bar.day}>{bar.label.replace(' ', '')}</span>
                  ))}
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title="Top software" subtitle="By downloads">
            {topSoftware.length === 0 ? (
              <EmptyState title="No software yet" message="Publish software to see performance here." />
            ) : (
              <DataTable
                rows={topSoftware}
                columns={[
                  { key: 'name', header: 'Software', render: (row) => row.name },
                  {
                    key: 'downloads',
                    header: 'Download count',
                    className: 'muted',
                    render: (row) => row.downloads.toLocaleString(),
                  },
                ]}
              />
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
