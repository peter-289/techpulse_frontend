import { GitBranch, ShieldAlert, UploadCloud, UserCheck, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useAuditEvents } from '@/entities/audit/api/audit.queries';
import { EmptyState, ErrorState, LoadingState, Segmented } from '@/shared/ui';
import {
  SectionCard,
  SectionPageHeader,
  StatCard,
  StatGrid,
} from './section-page';

type Category = 'All' | 'Uploads' | 'Lifecycle' | 'Access' | 'Other';

const categoryIcons: Record<Exclude<Category, 'All'>, LucideIcon> = {
  Uploads: UploadCloud,
  Lifecycle: GitBranch,
  Access: UserCheck,
  Other: ShieldAlert,
};

const categories: Category[] = ['All', 'Uploads', 'Lifecycle', 'Access'];

function formatDate(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditPage() {
  const [active, setActive] = useState<Category>('All');
  const query = useAuditEvents();
  const events = query.data ?? [];

  const visible = active === 'All' ? events : events.filter((entry) => entry.category === active);
  const countBy = (category: Exclude<Category, 'All'>) =>
    events.filter((entry) => entry.category === category).length;

  return (
    <div className="sec-page">
      <SectionPageHeader
        eyebrow="Assurance · Audit"
        title="Audit Center"
        description="An immutable trail of who did what, when — across uploads, lifecycle changes and access."
      />

      <StatGrid>
        <StatCard label="Events" value={events.length} helper="Immutable and exported" />
        <StatCard label="Uploads" value={countBy('Uploads')} helper="Across your catalogue" />
        <StatCard label="Lifecycle" value={countBy('Lifecycle')} helper="Promotions, yanks, edits" />
        <StatCard label="Access" value={countBy('Access')} helper="Logins, invites, sync events" />
      </StatGrid>

      <SectionCard
        title="Event trail"
        subtitle="Filter by category"
        actions={
          <Segmented
            className="sec-pills"
            buttonClassName="tp-btn tp-btn-sm tp-btn-ghost"
            ariaLabel="Filter audit events"
            value={active}
            onChange={setActive}
            options={categories.map((category) => ({ value: category, label: category }))}
          />
        }
      >
        {query.isLoading ? (
          <LoadingState label="Loading audit trail…" />
        ) : query.isError ? (
          <ErrorState message="We could not load the audit trail." onRetry={() => query.refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState
            title={events.length === 0 ? 'No recorded events' : 'No events in this category'}
            message="Activity appears here as your workspace is used."
          />
        ) : (
          <div className="sec-timeline">
            {visible.map((entry) => {
              const Icon = categoryIcons[entry.category];
              return (
                <div className="sec-timeline-item" key={entry.id}>
                  <span className="sec-timeline-dot" aria-hidden="true">
                    <Icon size={15} />
                  </span>
                  <div>
                    <p className="sec-timeline-title">{entry.title}</p>
                    <p className="sec-timeline-meta">
                      {entry.details ? `${entry.details} · ` : ''}
                      {formatDate(entry.occurredAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
