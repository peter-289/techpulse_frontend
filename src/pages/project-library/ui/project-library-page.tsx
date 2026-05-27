import { useMemo, useState } from 'react';
import { useSoftwareList } from '../../../entities/software/api/software.queries';
import { Card } from '../../../shared/ui/card/card';
import { Input } from '../../../shared/ui/input/input';
import { Select } from '../../../shared/ui/select/select';
import { Table } from '../../../shared/ui/table/table';
import { Badge } from '../../../shared/ui/badge/badge';
import { Skeleton } from '../../../shared/ui/skeleton/skeleton';

export function ProjectLibraryPage() {
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'newest'>('newest');

  const softwareQuery = useSoftwareList(160);

  const rows = useMemo(() => {
    const source = softwareQuery.data ?? [];
    const filtered = source.filter((item) => {
      const text = `${item.name} ${item.description} ${item.category}`.toLowerCase();
      if (query && !text.includes(query.toLowerCase())) return false;
      if (visibility === 'public' && !item.is_public) return false;
      if (visibility === 'private' && item.is_public) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return String(b.created_at).localeCompare(String(a.created_at));
    });
  }, [softwareQuery.data, query, visibility, sortBy]);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-white">Project Library</h1>
        <p className="text-sm text-slate-300">Artifact inventory optimized for search, filtering, and operational triage.</p>
      </header>

      <Card className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, description, category" />
        <Select value={visibility} onChange={(event) => setVisibility(event.target.value as 'all' | 'public' | 'private')}>
          <option value="all">All visibility</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </Select>
        <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'name' | 'newest')}>
          <option value="newest">Sort: Newest</option>
          <option value="name">Sort: Name</option>
        </Select>
      </Card>

      {softwareQuery.isLoading && (
        <Card><Skeleton className="h-48 w-full" /></Card>
      )}

      {softwareQuery.isError && (
        <Card className="border-rose-500/50">
          <h2 className="text-base font-medium text-rose-200">Library unavailable</h2>
          <p className="mt-1 text-sm text-slate-300">Could not load software artifacts.</p>
        </Card>
      )}

      {!softwareQuery.isLoading && !softwareQuery.isError && (
        <Card className="overflow-x-auto">
          <Table>
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2">Name</th>
                <th>Category</th>
                <th>Visibility</th>
                <th>Price</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-b border-slate-900 text-sm text-slate-200">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="line-clamp-1 text-xs text-slate-400">{item.description || 'No description'}</p>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <Badge variant={item.is_public ? 'success' : 'default'}>{item.is_public ? 'Public' : 'Private'}</Badge>
                  </td>
                  <td>{Number(item.price_cents || 0) > 0 ? `$${(Number(item.price_cents) / 100).toFixed(2)}` : 'Free'}</td>
                  <td>{item.owner_id || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          {rows.length === 0 && <p className="py-4 text-sm text-slate-400">No artifacts match your filters.</p>}
        </Card>
      )}
    </section>
  );
}
