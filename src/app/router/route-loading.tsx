import { Loader2 } from 'lucide-react';

/** Shared full-area loading state used while auth hydration / lazy routes resolve. */
export function RouteLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center gap-2 p-8 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span role="status">{label}</span>
    </div>
  );
}
