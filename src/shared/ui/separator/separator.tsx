import { cn } from '../../lib/cn';
import type { HTMLAttributes } from 'react';

export function Separator({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('border-0 border-t border-stone-800', className)} {...props} />;
}
