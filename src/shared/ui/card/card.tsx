import { cn } from '../../lib/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-slate-700 bg-slate-900/70 p-4 shadow-xl', className)} {...props} />;
}
