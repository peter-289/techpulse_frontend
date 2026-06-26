import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

export function Dialog({ open, children }: PropsWithChildren<{ open: boolean }>) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">{children}</div>;
}

export function DialogContent({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'w-full max-w-lg rounded-lg border border-stone-700 bg-neutral-900 p-4 shadow-[0_16px_44px_rgba(0,0,0,0.34)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
