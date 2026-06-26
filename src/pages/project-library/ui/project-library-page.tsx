import { useMemo, useState } from 'react';
import { Download, Eye, RefreshCw, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildSoftwareDownloadUrl, useSoftwareList } from '../../../entities/software/api/software.queries';
import { Card } from '../../../shared/ui/card/card';
import { Input } from '../../../shared/ui/input/input';
import { Select } from '../../../shared/ui/select/select';
import { Table } from '../../../shared/ui/table/table';
import { Badge } from '../../../shared/ui/badge/badge';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';
import { Button } from '../../../shared/ui/button/button';
import type { Software } from '../../../entities/software/model/software.schema';

function formatMoney(cents: number, currency = 'USD') {
  const amount = Number(cents || 0) / 100;
  if (amount <= 0) return 'Free';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

function formatDate(value: string) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export function ProjectLibraryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [access, setAccess] = useState<'all' | 'available' | 'locked'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'downloads'>('newest');

  const softwareQuery = useSoftwareList(160);

  const rows = useMemo(() => {
    const source = softwareQuery.data ?? [];
    const filtered = source.filter((item) => {
      const text = `${item.name} ${item.description} ${item.category}`.toLowerCase();
      if (query && !text.includes(query.toLowerCase())) return false;
      if (visibility === 'public' && !item.is_public) return false;
      if (visibility === 'private' && item.is_public) return false;
      if (access === 'available' && !item.viewer_has_access) return false;
      if (access === 'locked' && item.viewer_has_access) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'downloads') return Number(b.download_count || 0) - Number(a.download_count || 0);
      return String(b.created_at).localeCompare(String(a.created_at));
    });
  }, [softwareQuery.data, query, visibility, access, sortBy]);

  const openDetails = (software: Software) => {
    navigate('/workspace/software-details', { state: { software } });
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-stone-50">Project Library</h1>
          <p className="text-sm text-stone-400">Search, compare, open, and download software artifacts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => softwareQuery.refetch()} disabled={softwareQuery.isFetching}>
            <RefreshCw size={15} /> Refresh
          </Button>
          <Button onClick={() => navigate('/workspace/upload-project')}>
            <Upload size={15} /> Upload
          </Button>
        </div>
      </header>

      <Card className="grid gap-3 border-stone-700/80 bg-neutral-900/60 lg:grid-cols-[1fr,180px,180px,180px]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, description, category" />
        <Select value={visibility} onChange={(event) => setVisibility(event.target.value as 'all' | 'public' | 'private')}>
          <option value="all">All visibility</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </Select>
        <Select value={access} onChange={(event) => setAccess(event.target.value as 'all' | 'available' | 'locked')}>
          <option value="all">All access</option>
          <option value="available">Available</option>
          <option value="locked">Locked</option>
        </Select>
        <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'name' | 'newest' | 'downloads')}>
          <option value="newest">Sort: Newest</option>
          <option value="name">Sort: Name</option>
          <option value="downloads">Sort: Downloads</option>
        </Select>
      </Card>

      {softwareQuery.isLoading && (
        <Card><Skeleton className="h-48 w-full" /></Card>
      )}

      {softwareQuery.isError && (
        <Card className="border-rose-500/50">
          <h2 className="text-base font-medium text-red-200">Library unavailable</h2>
          <p className="mt-1 text-sm text-stone-300">Could not load software artifacts.</p>
        </Card>
      )}

      {!softwareQuery.isLoading && !softwareQuery.isError && (
        <Card className="overflow-x-auto p-0">
          <Table>
            <thead>
              <tr className="border-b border-stone-800 bg-neutral-950/40 text-left text-xs uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3">Name</th>
                <th>Category</th>
                <th>Visibility</th>
                <th>Price</th>
                <th>Latest</th>
                <th>Downloads</th>
                <th>Updated</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-b border-stone-800/80 text-sm text-stone-200 hover:bg-stone-900/70">
                  <td className="px-4 py-3 pr-3">
                    <p className="font-medium text-stone-50">{item.name}</p>
                    <p className="line-clamp-1 max-w-md text-xs text-stone-500">{item.description || 'No description'}</p>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <Badge variant={item.is_public ? 'success' : 'default'}>{item.is_public ? 'Public' : 'Private'}</Badge>
                  </td>
                  <td>{formatMoney(item.price_cents, item.currency)}</td>
                  <td>{item.latest_version ? `v${item.latest_version}` : '-'}</td>
                  <td>{item.download_count || 0}</td>
                  <td>{formatDate(item.updated_at || item.created_at)}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openDetails(item)} title="Open details" aria-label={`Open ${item.name}`}>
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!item.viewer_has_access || !item.latest_version}
                        onClick={() => {
                          if (item.latest_version) window.location.assign(buildSoftwareDownloadUrl(item.id, item.latest_version));
                        }}
                        title="Download latest"
                        aria-label={`Download ${item.name}`}
                      >
                        <Download size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {rows.length === 0 && <p className="px-4 py-4 text-sm text-stone-400">No artifacts match your filters.</p>}
        </Card>
      )}
    </section>
  );
}
