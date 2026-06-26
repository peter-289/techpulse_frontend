import { useMemo, useState } from 'react';
import { Download, Eye, RefreshCw, Search, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../shared/ui/card/card';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { Button } from '../../../shared/ui/button/button';
import { buildSoftwareDownloadUrl, useSoftwareList } from '../../../entities/software/api/software.queries';
import { Input } from '../../../shared/ui/input/input';
import { Select } from '../../../shared/ui/select/select';
import { Badge } from '../../../shared/ui/badge/badge';

function formatMoney(cents: number, currency = 'USD') {
  const amount = Number(cents || 0) / 100;
  if (amount <= 0) return 'Free';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

export function SoftwareRegistryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const { data, isLoading, isError, error, refetch, isFetching } = useSoftwareList(120);

  const categories = useMemo(() => ['all', ...Array.from(new Set((data ?? []).map((item) => item.category).filter(Boolean))).sort()], [data]);
  const filtered = useMemo(() => {
    return (data ?? []).filter((pkg) => {
      const text = `${pkg.name} ${pkg.description} ${pkg.category}`.toLowerCase();
      if (query && !text.includes(query.toLowerCase())) return false;
      if (category !== 'all' && pkg.category !== category) return false;
      return true;
    });
  }, [data, query, category]);

  const totals = useMemo(() => {
    const rows = data ?? [];
    return {
      public: rows.filter((pkg) => pkg.is_public).length,
      paid: rows.filter((pkg) => Number(pkg.price_cents || 0) > 0).length,
      downloads: rows.reduce((sum, pkg) => sum + Number(pkg.download_count || 0), 0),
    };
  }, [data]);

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-stone-50">Software Registry</h1>
          <p className="text-sm text-stone-400">Browse released packages, inspect access, and jump into version management.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={15} /> Refresh
          </Button>
          <Button onClick={() => navigate('/workspace/upload-project')}>
            <Upload size={15} /> Upload
          </Button>
        </div>
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
          <h2 className="text-base font-medium text-red-200">Registry unavailable</h2>
          <p className="mt-1 text-sm text-stone-300">{error instanceof Error ? error.message : 'Unexpected error while loading registry.'}</p>
          <Button className="mt-3" variant="danger" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-l-4 border-l-teal-400">
              <p className="text-xs text-stone-400">Public packages</p>
              <p className="mt-1 text-2xl font-semibold text-stone-50">{totals.public}</p>
            </Card>
            <Card className="border-l-4 border-l-amber-400">
              <p className="text-xs text-stone-400">Paid packages</p>
              <p className="mt-1 text-2xl font-semibold text-stone-50">{totals.paid}</p>
            </Card>
            <Card className="border-l-4 border-l-sky-400">
              <p className="text-xs text-stone-400">Total downloads</p>
              <p className="mt-1 text-2xl font-semibold text-stone-50">{totals.downloads}</p>
            </Card>
          </div>

          <Card className="grid gap-3 border-stone-700/80 bg-neutral-900/60 lg:grid-cols-[1fr,220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 text-stone-500" size={15} />
              <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search registry" />
            </div>
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item} value={item}>{item === 'all' ? 'All categories' : item}</option>
              ))}
            </Select>
          </Card>

          <div className="text-xs text-stone-500">{isFetching ? 'Refreshing in background...' : `${filtered.length} of ${data?.length ?? 0} packages shown`}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((pkg) => (
              <Card key={pkg.id} className="transition-colors hover:border-teal-500/40">
                <div className="flex h-full flex-col gap-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-stone-50">{pkg.name}</h3>
                      <Badge variant={pkg.viewer_has_access ? 'success' : 'warning'}>{pkg.viewer_has_access ? 'Available' : 'Locked'}</Badge>
                    </div>
                    <p className="line-clamp-2 min-h-10 text-sm text-stone-300">{pkg.description || 'No description provided.'}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                      <span>{pkg.is_public ? 'Public' : 'Private'}</span>
                      <span>{pkg.category}</span>
                      <span>{formatMoney(pkg.price_cents, pkg.currency)}</span>
                    </div>
                  </div>
                  <div className="mt-auto grid grid-cols-3 gap-2 rounded-lg border border-stone-800 bg-neutral-950/55 p-2 text-xs text-stone-400">
                    <span><strong className="block text-stone-50">{pkg.latest_version || '-'}</strong>Latest</span>
                    <span><strong className="block text-stone-50">{pkg.download_count || 0}</strong>Downloads</span>
                    <span><strong className="block text-stone-50">{pkg.owner_id || '-'}</strong>Owner</span>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" variant="secondary" onClick={() => navigate('/workspace/software-details', { state: { software: pkg } })}>
                      <Eye size={14} /> Details
                    </Button>
                    <Button
                      className="flex-1"
                      variant="ghost"
                      disabled={!pkg.viewer_has_access || !pkg.latest_version}
                      onClick={() => {
                        if (pkg.latest_version) window.location.assign(buildSoftwareDownloadUrl(pkg.id, pkg.latest_version));
                      }}
                    >
                      <Download size={14} /> Download
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {filtered.length === 0 && <Card><p className="text-sm text-stone-400">No packages match your filters.</p></Card>}
        </div>
      )}
    </section>
  );
}
