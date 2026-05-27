import { cn } from '../../lib/cn';
import type { HTMLAttributes } from 'react';

type Variant = 'default' | 'success' | 'warning';

const variantMap: Record<Variant, string> = {
  default: 'bg-slate-700 text-slate-100',
  success: 'bg-emerald-500/20 text-emerald-300',
  warning: 'bg-amber-500/20 text-amber-300',
};

export function Badge({
  className,
  children,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', variantMap[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
