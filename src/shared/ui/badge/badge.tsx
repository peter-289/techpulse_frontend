import { cn } from '../../lib/cn';
import type { HTMLAttributes } from 'react';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const variantMap: Record<Variant, string> = {
  default: 'border-blue-600/10 bg-slate-100 text-slate-600',
  success: 'border-green-600/20 bg-green-600/10 text-green-700',
  warning: 'border-amber-600/20 bg-amber-600/10 text-amber-700',
  danger: 'border-red-600/20 bg-red-600/10 text-red-700',
  info: 'border-blue-600/20 bg-blue-600/10 text-blue-700',
};

export function Badge({
  className,
  children,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantMap[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
