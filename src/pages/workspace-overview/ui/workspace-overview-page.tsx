import { useMemo } from 'react';
import { ArrowRight, Download, PackageCheck, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSoftwareAdminSummary, useSoftwareList } from '../../../entities/software/api/software.queries';
import { useSupportMessages } from '../../../entities/support/api/support.queries';
import { Card } from '../../../shared/ui/card/card';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { Badge } from '../../../shared/ui/badge/badge';
import { Button } from '../../../shared/ui/button/button';

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

export function WorkspaceOverviewPage() {
  const navigate = useNavigate();
  const softwareQuery = useSoftwareList(120);
  const supportQuery = useSupportMessages(100);
  const adminSummaryQuery = useSoftwareAdminSummary();

  const stats = useMemo(() => {
    const software = softwareQuery.data ?? [];
    const publicCount = software.filter((item) => item.is_public).length;
    const privateCount = software.length - publicCount;
    const paidCount = software.filter((item) => Number(item.price_cents || 0) > 0).length;
    const downloadCount = software.reduce((sum, item) => sum + Number(item.download_count || 0), 0);

    return [
      { label: 'Packages', value: adminSummaryQuery.data?.total_packages ?? software.length, helper: 'Total managed artifacts' },
      { label: 'Public', value: publicCount, helper: 'Available for discovery' },
      { label: 'Private', value: privateCount, helper: 'Restricted visibility' },
      { label: 'Downloads', value: adminSummaryQuery.data?.total_downloads ?? downloadCount, helper: 'Artifact downloads' },
      { label: 'Paid packages', value: paidCount, helper: 'Monetized artifacts' },
    ];
  }, [adminSummaryQuery.data, softwareQuery.data]);

  const isLoading = softwareQuery.isLoading || supportQuery.isLoading;
  const hasError = softwareQuery.isError || supportQuery.isError;
  const recentPackages = (softwareQuery.data ?? []).slice(0, 5);

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-stone-50">Workspace Overview</h1>
          <p className="text-sm text-stone-400">Registry health, package movement, and support activity at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/workspace/project-library')}>
            <PackageCheck size={15} /> Library
          </Button>
          <Button onClick={() => navigate('/workspace/upload-project')}>
            <Upload size={15} /> Upload
          </Button>
        </div>
      </header>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><Skeleton className="h-16 w-full" /></Card>
          ))}
        </div>
      )}

      {hasError && (
        <Card className="border-rose-500/50">
          <h2 className="text-base font-medium text-red-200">Overview unavailable</h2>
          <p className="mt-1 text-sm text-stone-300">Unable to load dashboard metrics from one or more services.</p>
        </Card>
      )}

      {!isLoading && !hasError && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => (
              <Card key={item.label} className="border-l-4 border-l-teal-500/80">
                <p className="text-xs text-stone-400">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-stone-50">{formatNumber(item.value)}</p>
                <p className="mt-1 text-xs text-stone-500">{item.helper}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.4fr,1fr]">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-medium text-stone-50">Recent Packages</h2>
                <Button variant="ghost" onClick={() => navigate('/workspace/software-registry')}>
                  Open <ArrowRight size={14} />
                </Button>
              </div>
              <div className="space-y-2">
                {recentPackages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate('/workspace/software-details', { state: { software: item } })}
                    className="grid w-full gap-2 rounded-lg border border-stone-800 bg-neutral-950/45 p-3 text-left text-sm text-stone-200 transition-colors hover:border-teal-500/40 hover:bg-stone-900/70 sm:grid-cols-[1fr,120px,100px]"
                  >
                    <span>
                      <strong className="block text-stone-50">{item.name}</strong>
                      <span className="line-clamp-1 text-xs text-stone-500">{item.description || 'No description'}</span>
                    </span>
                    <span>{item.latest_version ? `v${item.latest_version}` : 'No version'}</span>
                    <span className="inline-flex items-center gap-1"><Download size={13} /> {item.download_count || 0}</span>
                  </button>
                ))}
                {!recentPackages.length && <p className="text-sm text-stone-400">No packages have been uploaded yet.</p>}
              </div>
            </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-medium text-stone-50">Recent Support Stream</h2>
              <Badge variant="warning">Live</Badge>
            </div>
            <div className="space-y-2">
              {(supportQuery.data ?? []).slice(0, 8).map((message) => (
                <div key={message.id} className="rounded-lg border border-stone-800 bg-neutral-950/45 p-2">
                  <p className="text-xs text-stone-500">{message.role}</p>
                  <p className="text-sm text-stone-200">{message.content || 'No content'}</p>
                </div>
              ))}
              {(supportQuery.data ?? []).length === 0 && <p className="text-sm text-stone-400">No support activity found.</p>}
            </div>
          </Card>
          </div>
        </>
      )}
    </section>
  );
}
