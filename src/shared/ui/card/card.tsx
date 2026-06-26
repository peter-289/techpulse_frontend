import { cn } from '../../lib/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-stone-700/70 bg-neutral-900/80 p-4 shadow-[0_1px_1px_rgba(0,0,0,0.22)]',
        className,
      )}
      {...props}
    />
  );
}
