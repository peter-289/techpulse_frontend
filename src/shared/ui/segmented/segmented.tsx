import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  buttonClassName,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  buttonClassName?: string;
}) {
  return (
    <div className={className} role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            type="button"
            key={option.value}
            className={cn(buttonClassName, active && 'is-active')}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
