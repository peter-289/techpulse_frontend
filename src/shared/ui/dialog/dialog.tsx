import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

export function Dialog({ open, children }: PropsWithChildren<{ open: boolean }>) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">{children}</div>;
}

export function DialogContent({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl', className)}>{children}</div>;
}
