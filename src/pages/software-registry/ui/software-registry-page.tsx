import { Card } from '../../../shared/ui/card/card';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { Button } from '../../../shared/ui/button/button';
import { useSoftwareList } from '../../../entities/software/api/software.queries';

export function SoftwareRegistryPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useSoftwareList(120);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Software Registry</h1>
        <p className="text-sm text-slate-300">Artifact catalog with cache-aware data synchronization and resilient loading states.</p>
      </header>

      {isLoading && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><Skeleton className="h-20 w-full" /></Card>
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-rose-500/50">
          <h2 className="text-base font-medium text-rose-200">Registry unavailable</h2>
          <p className="mt-1 text-sm text-slate-300">{error instanceof Error ? error.message : 'Unexpected error while loading registry.'}</p>
          <Button className="mt-3" variant="danger" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">{isFetching ? 'Refreshing in background...' : `${data?.length ?? 0} packages loaded`}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(data ?? []).map((pkg) => (
              <Card key={pkg.id}>
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-white">{pkg.name}</h3>
                  <p className="line-clamp-2 text-sm text-slate-300">{pkg.description || 'No description provided.'}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>Owner: {pkg.owner_id || 'N/A'}</span>
                    <span>{pkg.is_public ? 'Public' : 'Private'}</span>
                    <span>{pkg.category}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
