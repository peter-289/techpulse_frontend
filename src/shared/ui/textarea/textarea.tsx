import { cn } from '../../lib/cn';
import type { TextareaHTMLAttributes } from 'react';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-lg border border-stone-700 bg-neutral-950/70 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/15',
        className,
      )}
      {...props}
    />
  );
}
