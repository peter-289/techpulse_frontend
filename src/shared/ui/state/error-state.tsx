import { AlertTriangle } from 'lucide-react';
import { Button } from '../button/button';

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600" aria-hidden="true">
        <AlertTriangle size={18} />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
