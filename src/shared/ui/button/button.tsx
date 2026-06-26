import { cn } from '../../lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'border border-teal-400/70 bg-teal-400 text-neutral-950 hover:bg-teal-300',
  secondary: 'border border-stone-600 bg-stone-800 text-stone-100 hover:bg-stone-700',
  ghost: 'border border-transparent bg-transparent text-stone-200 hover:border-stone-700 hover:bg-stone-900',
  danger: 'border border-red-400/60 bg-red-500 text-white hover:bg-red-400',
};

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
