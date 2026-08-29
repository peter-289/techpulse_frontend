import type { ReactNode } from 'react';
import { Activity, ArrowRight, BadgeCheck, Download, Layers3, PackageOpen, RefreshCw, Search, ShieldAlert, Sparkles, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildSoftwareDownloadUrl, useSoftwareAdminSummary, useSoftwareList } from '../../../entities/software/api/software.queries';
import type { Software } from '../../../entities/software/model/software.schema';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';

const formatNumber = new Intl.NumberFormat().format;

function formatRelativeTime(dateValue?: string | null) {
  if (!dateValue) return 'Recently';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-950/80 p-5 shadow-sm shadow-black/20 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal-300">TechPulse</p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-50">TechPulse Dashboard</h1>
          <p className="max-w-2xl text-sm text-stone-400">Manage your software, verify release health, and discover what is available to download.</p>
        </div>
      </div>
      <Button onClick={() => window.location.assign('/workspace/upload-project')}>
        <Upload size={15} /> Upload software
      </Button>
    </header>
  );
}

function QuickAction({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-2xl border border-stone-800 bg-stone-900/60 p-4 text-left transition-colors hover:border-teal-500/40 hover:bg-stone-900"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-300">
        <Sparkles size={16} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-stone-50">{title}</h3>
        <p className="mt-1 text-xs text-stone-400">{description}</p>
      </div>
    </button>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-50">Quick actions</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <QuickAction title="Upload software" description="Add a new package or version." onClick={() => navigate('/workspace/upload-software')} />
        <QuickAction title="Browse software" description="Review your package inventory." onClick={() => navigate('/workspace/softwares')} />
        <QuickAction title="Discover software" description="Open the public catalog." onClick={() => navigate('/workspace/discover')} />
      </div>
    </div>
  );
}

type MetricTone = 'teal' | 'amber' | 'sky' | 'rose';

function MetricCard({ label, value, helper, tone = 'teal' }: { label: string; value: string | number; helper: string; tone?: MetricTone }) {
  const toneMap: Record<MetricTone, string> = {
    teal: 'border-teal-500/40 bg-teal-500/5',
    amber: 'border-amber-500/40 bg-amber-500/5',
    sky: 'border-sky-500/40 bg-sky-500/5',
    rose: 'border-rose-500/40 bg-rose-500/5',
  };

  return (
    <Card className={`border-l-4 ${toneMap[tone ?? 'teal']} p-4`}>
      <p className="text-xs uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-stone-50">{value}</p>
      <p className="mt-1 text-xs text-stone-400">{helper}</p>
    </Card>
  );
}

function MetricGrid({ metrics }: { metrics: Array<{ label: string; value: number; helper: string; tone: MetricTone }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} label={metric.label} value={formatNumber(metric.value)} helper={metric.helper} tone={metric.tone ?? 'teal'} />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, description, primaryAction, secondaryAction }: { icon: ReactNode; title: string; description: string; primaryAction?: { label: string; onClick: () => void }; secondaryAction?: { label: string; onClick: () => void } }) {
  return (
    <Card className="border-dashed border-stone-700 bg-stone-950/30">
      <div className="flex flex-col items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-stone-700 bg-stone-900 text-stone-300">{icon}</div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-stone-50">{title}</h3>
          <p className="text-sm text-stone-400">{description}</p>
        </div>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {primaryAction && <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>}
            {secondaryAction && <Button variant="secondary" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>}
          </div>
        )}
      </div>
    </Card>
  );
}

function ErrorState({ title, description, onRetry }: { title: string; description: string; onRetry: () => void }) {
  return (
    <Card className="border-rose-500/50 bg-rose-500/5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-rose-100">{title}</h3>
          <p className="text-sm text-stone-300">{description}</p>
        </div>
        <Button variant="secondary" onClick={onRetry}><RefreshCw size={14} /> Retry</Button>
      </div>
    </Card>
  );
}

function SoftwareCard({ software, onOpen, onDownload }: { software: Software; onOpen: () => void; onDownload: () => void }) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-stone-800 bg-stone-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-300">
            <PackageOpen size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-50">{software.name}</h3>
            <p className="text-xs text-stone-400">{software.latest_version ? `v${software.latest_version}` : 'No version published'}</p>
          </div>
        </div>
        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${software.is_public ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-stone-700 bg-stone-800 text-stone-300'}`}>
          {software.is_public ? 'Public' : 'Private'}
        </span>
      </div>

      <p className="line-clamp-2 text-sm text-stone-400">{software.description || 'No description provided.'}</p>

      <div className="mt-auto grid grid-cols-3 gap-2 rounded-xl border border-stone-800 bg-stone-900/60 p-2 text-xs text-stone-400">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-stone-500">Downloads</p>
          <p className="mt-1 font-semibold text-stone-50">{formatNumber(Number(software.download_count || 0))}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-stone-500">Updated</p>
          <p className="mt-1 font-semibold text-stone-50">{formatRelativeTime(software.updated_at || software.created_at)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-stone-500">Access</p>
          <p className="mt-1 font-semibold text-stone-50">{software.viewer_has_access ? 'Allowed' : 'Restricted'}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onOpen}>Open</Button>
        <Button className="flex-1" onClick={onDownload} disabled={!software.latest_version}>Download</Button>
      </div>
    </div>
  );
}

function SoftwareSection({ software, isLoading, isError, onRetry }: { software: Software[]; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-50">My software</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="h-60"><Skeleton className="h-full w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="We couldn't load your software." description="Something went wrong while retrieving your package list." onRetry={onRetry} />;
  }

  if (!software.length) {
    return (
      <EmptyState
        icon={<PackageOpen size={18} />}
        title="You haven't uploaded any software yet."
        description="Upload your first package to start tracking releases and downloads."
        primaryAction={{ label: 'Upload software', onClick: () => navigate('/workspace/upload-project') }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-stone-50">My software</h2>
        <button type="button" onClick={() => navigate('/workspace/software')} className="inline-flex items-center gap-1 text-sm text-teal-300 transition-colors hover:text-teal-200">
          View all <ArrowRight size={14} />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {software.slice(0, 3).map((item) => (
          <SoftwareCard
            key={item.id}
            software={item}
            onOpen={() => navigate('/workspace/software-details', { state: { software: item } })}
            onDownload={() => {
              if (item.latest_version) {
                window.location.assign(buildSoftwareDownloadUrl(item.id, item.latest_version));
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AttentionPanel({ software }: { software: Software[] }) {
  const attentionItems = software
    .filter((item) => !item.is_public || !item.latest_version)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      title: item.is_public ? 'Version information missing' : 'Private software is hidden from discovery',
      description: item.is_public ? `Package ${item.name} does not currently expose a published version.` : `Package ${item.name} is private and will not appear in the public catalog.`,
    }));

  if (!attentionItems.length) {
    return (
      <Card className="border-stone-800 bg-stone-950/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
            <BadgeCheck size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-50">Nothing requires attention.</h3>
            <p className="mt-1 text-sm text-stone-400">Your current software inventory is in a healthy state.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-stone-800 bg-stone-950/30">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-amber-300" />
        <h3 className="text-lg font-semibold text-stone-50">Attention</h3>
      </div>
      <div className="mt-4 space-y-3">
        {attentionItems.map((item) => (
          <div key={item.id} className="rounded-xl border border-stone-800 bg-stone-900/60 p-3">
            <p className="text-sm font-medium text-stone-50">{item.title}</p>
            <p className="mt-1 text-xs text-stone-400">{item.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActivityFeed({ software }: { software: Software[] }) {
  const items = software.slice(0, 4).map((item) => ({
    id: item.id,
    title: item.latest_version ? `Version ${item.latest_version} published` : 'Software updated',
    time: item.updated_at || item.created_at,
    description: `${item.name} · ${Number(item.download_count || 0)} downloads`,
  }));

  if (!items.length) {
    return (
      <EmptyState
        icon={<Activity size={18} />}
        title="Nothing has happened yet."
        description="Activity shows up here once you upload software or releases are published."
      />
    );
  }

  return (
    <Card className="border-stone-800 bg-stone-950/30">
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-teal-300" />
        <h3 className="text-lg font-semibold text-stone-50">Recent activity</h3>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-300">
              <Download size={12} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-100">{item.title}</p>
              <p className="mt-1 text-xs text-stone-400">{item.description}</p>
            </div>
            <span className="text-[11px] text-stone-500">{formatRelativeTime(item.time)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DiscoverySection({ software, isLoading, isError, onRetry }: { software: Software[]; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  const navigate = useNavigate();
  const discoverItems = software.filter((item) => item.is_public).slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-50">Discover</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="h-32"><Skeleton className="h-full w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="We couldn't load discoverable software." description="Something went wrong while retrieving the catalog." onRetry={onRetry} />;
  }

  if (!discoverItems.length) {
    return (
      <EmptyState
        icon={<Search size={18} />}
        title="No public software is available right now."
        description="Once packages are published publicly, they will appear here for discovery."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-stone-50">Discover</h2>
        <button type="button" onClick={() => navigate('/workspace/discover')} className="inline-flex items-center gap-1 text-sm text-teal-300 transition-colors hover:text-teal-200">
          Explore all <ArrowRight size={14} />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {discoverItems.map((item) => (
          <Card key={item.id} className="border-stone-800 bg-stone-950/40 p-4">
            <div className="flex h-full flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-stone-50">{item.name}</h3>
                  <p className="text-xs text-stone-400">{item.latest_version ? `v${item.latest_version}` : 'Version pending'}</p>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald-200">
                  {Number(item.price_cents || 0) > 0 ? 'Priced' : 'Free'}
                </span>
              </div>
              <p className="line-clamp-3 text-sm text-stone-400">{item.description || 'No description provided.'}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-stone-400">
                <span>{formatNumber(Number(item.download_count || 0))} downloads</span>
                <Button variant="secondary" onClick={() => navigate('/workspace/software-details', { state: { software: item } })}>Open</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceOverviewPage() {
  const softwareQuery = useSoftwareList(50);
  const summaryQuery = useSoftwareAdminSummary();
  const software = softwareQuery.data ?? [];
  const summary = summaryQuery.data ?? { total_packages: software.length, total_versions: 0, total_downloads: 0, published_versions: 0 };

  const metrics: Array<{ label: string; value: number; helper: string; tone: 'teal' | 'amber' | 'sky' | 'rose' }> = [
    { label: 'Software', value: Number(summary.total_packages ?? software.length), helper: 'Packages in your inventory', tone: 'teal' },
    { label: 'Versions', value: Number(summary.total_versions ?? software.filter((item) => item.latest_version).length), helper: 'Published version entries', tone: 'amber' },
    { label: 'Downloads', value: Number(summary.total_downloads ?? software.reduce((sum, item) => sum + Number(item.download_count || 0), 0)), helper: 'Total recorded downloads', tone: 'sky' },
    { label: 'Public', value: software.filter((item) => item.is_public).length, helper: 'Visible in discovery', tone: 'rose' },
  ];

  const isLoading = softwareQuery.isLoading || summaryQuery.isLoading;
  const isError = softwareQuery.isError || summaryQuery.isError;

  return (
    <section className="space-y-5">
      <DashboardHeader />
      <QuickActions />

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-28"><Skeleton className="h-full w-full" /></Card>
          ))}
        </div>
      )}

      {!isLoading && !isError && <MetricGrid metrics={metrics} />}

      {isError && (
        <ErrorState
          title="The dashboard is temporarily unavailable."
          description="We couldn't fetch the software summary needed to render dashboard metrics."
          onRetry={() => {
            softwareQuery.refetch();
            summaryQuery.refetch();
          }}
        />
      )}

      {!isLoading && !isError && (
        <div className="grid gap-5 xl:grid-cols-[1.6fr,0.9fr]">
          <div className="space-y-5">
            <SoftwareSection software={software} isLoading={false} isError={false} onRetry={() => softwareQuery.refetch()} />
            <DiscoverySection software={software} isLoading={false} isError={false} onRetry={() => softwareQuery.refetch()} />
          </div>
          <div className="space-y-5">
            <AttentionPanel software={software} />
            <ActivityFeed software={software} />
          </div>
        </div>
      )}
    </section>
  );
}
