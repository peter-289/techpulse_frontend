import { cn } from '../../lib/cn';
import type { SelectHTMLAttributes } from 'react';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('h-10 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100', className)}
      {...props}
    />
  );
}
