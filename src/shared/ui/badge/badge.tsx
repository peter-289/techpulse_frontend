import { cn } from '../../lib/cn';
import type { HTMLAttributes } from 'react';

type Variant = 'default' | 'success' | 'warning';

const variantMap: Record<Variant, string> = {
  default: 'border-stone-600 bg-stone-800 text-stone-100',
  success: 'border-teal-500/40 bg-teal-500/15 text-teal-200',
  warning: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
};

export function Badge({
  className,
  children,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium', variantMap[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
