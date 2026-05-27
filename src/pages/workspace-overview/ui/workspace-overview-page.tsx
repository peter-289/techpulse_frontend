import { useMemo } from 'react';
import { useSoftwareList } from '../../../entities/software/api/software.queries';
import { useSupportMessages } from '../../../entities/support/api/support.queries';
import { Card } from '../../../shared/ui/card/card';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { Badge } from '../../../shared/ui/badge/badge';

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

export function WorkspaceOverviewPage() {
  const softwareQuery = useSoftwareList(120);
  const supportQuery = useSupportMessages(100);

  const stats = useMemo(() => {
    const software = softwareQuery.data ?? [];
    const publicCount = software.filter((item) => item.is_public).length;
    const privateCount = software.length - publicCount;
    const paidCount = software.filter((item) => Number(item.price_cents || 0) > 0).length;

    return [
      { label: 'Packages', value: software.length, helper: 'Total managed artifacts' },
      { label: 'Public', value: publicCount, helper: 'Available for discovery' },
      { label: 'Private', value: privateCount, helper: 'Restricted visibility' },
      { label: 'Support events', value: supportQuery.data?.length ?? 0, helper: 'AI support interactions' },
      { label: 'Paid packages', value: paidCount, helper: 'Monetized artifacts' },
    ];
  }, [softwareQuery.data, supportQuery.data]);

  const isLoading = softwareQuery.isLoading || supportQuery.isLoading;
  const hasError = softwareQuery.isError || supportQuery.isError;

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Workspace Overview</h1>
        <p className="text-sm text-slate-300">Operational summary for registry health, visibility, and support load.</p>
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
          <h2 className="text-base font-medium text-rose-200">Overview unavailable</h2>
          <p className="mt-1 text-sm text-slate-300">Unable to load dashboard metrics from one or more services.</p>
        </Card>
      )}

      {!isLoading && !hasError && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((item) => (
              <Card key={item.label}>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(item.value)}</p>
                <p className="mt-1 text-xs text-slate-500">{item.helper}</p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-medium text-white">Recent Support Stream</h2>
              <Badge variant="warning">Live</Badge>
            </div>
            <div className="space-y-2">
              {(supportQuery.data ?? []).slice(0, 8).map((message) => (
                <div key={message.id} className="rounded-md border border-slate-800 bg-slate-900/60 p-2">
                  <p className="text-xs text-slate-400">{message.role}</p>
                  <p className="text-sm text-slate-200">{message.content || 'No content'}</p>
                </div>
              ))}
              {(supportQuery.data ?? []).length === 0 && <p className="text-sm text-slate-400">No support activity found.</p>}
            </div>
          </Card>
        </>
      )}
    </section>
  );
}
