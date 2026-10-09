import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'Nothing here yet',
  message = 'There is no data to display at the moment.',
  icon,
  action,
}: {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600" aria-hidden="true">
        {icon ?? <Inbox size={18} />}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      </div>
      {action}
    </div>
  );
}
