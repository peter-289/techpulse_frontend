import { cn } from '../../lib/cn';
import type { SelectHTMLAttributes } from 'react';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 rounded-[10px] border border-blue-600/15 bg-white/90 px-3.5 text-sm text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition duration-200 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
