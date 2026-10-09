import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { useSecurityScans } from '@/entities/security/api/security.queries';
import { Badge } from '@/shared/ui/badge/badge';
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui';
import {
  SectionCard,
  SectionNote,
  SectionPageHeader,
  StatCard,
  StatGrid,
} from './section-page';

function relativeTime(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${Math.max(seconds, 1)} s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function SecurityPage() {
  const query = useSecurityScans();
  const scans = query.data ?? [];

  const threats = scans.filter((scan) => scan.result === 'threat').length;
  const pending = scans.filter((scan) => scan.result === 'pending').length;
  const clean = scans.filter((scan) => scan.result === 'clean').length;
  const passRate = scans.length ? ((clean / scans.length) * 100).toFixed(1) : '—';

  return (
    <div className="sec-page">
      <SectionPageHeader
        eyebrow="Assurance · Security"
        title="Security Center"
        description="Malware scanning, signature analysis and runtime verification for every artifact in flight."
      />

      <StatGrid>
        <StatCard label="Pass rate" value={scans.length ? `${passRate}%` : '—'} helper={`${scans.length} scans analysed`} tone="success" />
        <StatCard label="Threats blocked" value={threats} helper="Quarantined, never shipped" tone="danger" />
        <StatCard label="Scans" value={scans.length} helper="Across every version" />
        <StatCard label="Quarantine" value={pending} helper="Held for investigation" tone="warning" />
      </StatGrid>

      <SectionNote icon={<ShieldCheck size={16} />}>
        <p>
          <strong>Scan-on-upload is automatic.</strong> No release progresses out of the review stage
          until every artifact matches a known-clean signature set. Blocked files are listed in the{' '}
          <strong>Artifact Explorer</strong> with a &ldquo;Blocked&rdquo; state.
        </p>
      </SectionNote>

      <SectionCard
        title="Recent scans"
        subtitle="Latest analysis results across your catalog"
        actions={<Badge variant="info">{scans.length} results</Badge>}
      >
        {query.isLoading ? (
          <LoadingState label="Loading scan results…" />
        ) : query.isError ? (
          <ErrorState message="We could not load security scans." onRetry={() => query.refetch()} />
        ) : scans.length === 0 ? (
          <EmptyState title="No scans yet" message="Scan results appear here after your first upload." />
        ) : (
          <div className="sec-timeline">
            {scans.map((scan) => {
              const threat = scan.result === 'threat';
              return (
                <div className="sec-timeline-item" key={scan.id}>
                  <span
                    className={`sec-timeline-dot ${threat ? 'warning' : 'success'}`}
                    aria-hidden="true"
                  >
                    {threat ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}
                  </span>
                  <div>
                    <p className="sec-timeline-title sec-mono">{scan.file}</p>
                    <p className="sec-timeline-meta">
                      {scan.engine} · {relativeTime(scan.createdAt)}
                      {scan.quarantineReason ? ` · ${scan.quarantineReason}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionNote icon={<Shield size={16} />}>
        <p>
          <strong>Going deeper.</strong> Runtime sandboxing, supply-chain attestation and SBOM export
          are available on the Enterprise plan. Manage your plan from <strong>Settings</strong>.
        </p>
      </SectionNote>
    </div>
  );
}
