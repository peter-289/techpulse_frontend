import { cn } from '../../lib/cn';
import type { TableHTMLAttributes } from 'react';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse text-sm', className)} {...props} />;
}
