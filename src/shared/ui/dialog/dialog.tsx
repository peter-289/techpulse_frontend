import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

export function Dialog({ open, children }: PropsWithChildren<{ open: boolean }>) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4 backdrop-blur-sm">{children}</div>
  );
}

export function DialogContent({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'w-full max-w-lg rounded-2xl border border-blue-600/10 bg-white/95 p-6 text-slate-900 shadow-[0_34px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
