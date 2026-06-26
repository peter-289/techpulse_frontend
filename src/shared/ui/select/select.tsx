import { cn } from '../../lib/cn';
import type { SelectHTMLAttributes } from 'react';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 rounded-lg border border-stone-700 bg-neutral-950/70 px-3 text-sm text-stone-100 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/15',
        className,
      )}
      {...props}
    />
  );
}
