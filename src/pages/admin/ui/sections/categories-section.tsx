import { useState, type FormEvent } from 'react';
import { useAdminCategories, useBulkCreateCategories } from '../../../../entities/category/api/category.queries';

type Draft = { name: string; slug: string; description: string };
const blank = (): Draft => ({ name: '', slug: '', description: '' });

export default function CategoriesSection() {
  const query = useAdminCategories();
  const mutation = useBulkCreateCategories();
  const [drafts, setDrafts] = useState<Draft[]>([blank()]);
  const [message, setMessage] = useState<string | null>(null);
  const update = (index: number, field: keyof Draft, value: string) => setDrafts((rows) => rows.map((row, i) => i === index ? { ...row, [field]: value } : row));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const rows = drafts.filter((row) => row.name.trim());
    if (!rows.length) { setMessage('Add at least one category name.'); return; }
    try {
      await mutation.mutateAsync(rows.map((row) => {
        const payload: { name: string; slug?: string; description?: string } = { name: row.name };
        if (row.slug) payload.slug = row.slug;
        if (row.description) payload.description = row.description;
        return payload;
      }));
      setDrafts([blank()]);
      setMessage('Categories created successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Categories could not be created.');
    }
  };
  return <section className="space-y-4">
    <div><h2 className="text-xl font-semibold">Category management</h2><p className="text-sm text-slate-500">Create normalized categories in one transaction.</p></div>
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      {drafts.map((row, index) => <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_1.5fr_auto]">
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Name" value={row.name} onChange={(e) => update(index, 'name', e.target.value)} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Slug (optional)" value={row.slug} onChange={(e) => update(index, 'slug', e.target.value)} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Description" value={row.description} onChange={(e) => update(index, 'description', e.target.value)} />
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" disabled={drafts.length === 1} onClick={() => setDrafts((items) => items.filter((_, i) => i !== index))}>Remove</button>
      </div>)}
      <div className="flex flex-wrap gap-2"><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setDrafts((rows) => [...rows, blank()])}>Add row</button><button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white" disabled={mutation.isPending}>{mutation.isPending ? 'Creating…' : 'Create categories'}</button></div>
      {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
    </form>
    <div className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-medium">Existing categories</h3>{query.isLoading ? <p className="mt-2 text-sm text-slate-500">Loading…</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(query.data ?? []).map((category) => <div key={category.id} className="rounded-lg border border-slate-200 p-3"><p className="font-medium">{category.name}</p><p className="text-xs text-slate-500">{category.slug || 'No slug'}{category.deleted_at ? ' · Archived' : ''}</p></div>)}</div>}</div>
  </section>;
}
