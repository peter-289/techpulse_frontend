import { cn } from '../../lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-blue-600/10', className)} aria-hidden="true" />;
}
