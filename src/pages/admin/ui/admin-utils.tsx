import type { ReactNode } from 'react';

export const toDate = (value: string | number | Date): string =>
  new Date(value).toLocaleString();

export type Tone = 'danger' | 'warning' | 'success' | 'info';

export const tone = (value: unknown): Tone => {
  const v = String(value).toLowerCase();
  if (
    v.includes('critical') ||
    v.includes('flagged') ||
    v.includes('suspended') ||
    v.includes('rejected')
  )
    return 'danger';
  if (v.includes('warning') || v.includes('pending')) return 'warning';
  if (v.includes('active') || v.includes('approved') || v.includes('healthy'))
    return 'success';
  return 'info';
};

export function Pill({ value }: { value: ReactNode }) {
  return <span className={`adm-pill ${tone(value)}`}>{value}</span>;
}
