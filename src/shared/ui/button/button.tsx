import { cn } from '../../lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'border border-blue-500/40 bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-[0_12px_26px_rgba(37,99,235,0.22)] hover:from-blue-600 hover:to-blue-700 hover:-translate-y-px hover:shadow-[0_16px_32px_rgba(37,99,235,0.28)] active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  secondary:
    'border border-blue-600/10 bg-white/80 text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:bg-white hover:border-blue-600/20 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  ghost:
    'border border-transparent bg-transparent text-slate-600 hover:bg-blue-600/5 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  danger:
    'border border-transparent bg-gradient-to-r from-red-500 to-red-600 text-white shadow-[0_12px_26px_rgba(220,38,38,0.2)] hover:to-red-700 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-8 px-3 py-1.5 text-xs rounded-md',
  md: 'min-h-10 px-4 py-2 text-sm rounded-lg',
  lg: 'min-h-12 px-6 py-3 text-[0.95rem] rounded-xl',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold leading-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0',
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
