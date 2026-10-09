import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Card } from '@/shared/ui/card/card';
import './section-page.css';

export function SectionNote({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="sec-note">
      {icon}
      <div>{children}</div>
    </div>
  );
}

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function SectionPageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="sec-head">
      <div className="sec-head-text">
        <p className="sec-eyebrow">{eyebrow}</p>
        <h1 className="sec-title">{title}</h1>
        <p className="sec-desc">{description}</p>
      </div>
      {actions && <div className="sec-actions">{actions}</div>}
    </header>
  );
}

export function SectionCard({
  title,
  subtitle,
  actions,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn('sec-card', className)}>
      {(title || actions) && (
        <div className="sec-card-head">
          <div>
            {title && <h2 className="sec-card-title">{title}</h2>}
            {subtitle && <p className="sec-card-sub">{subtitle}</p>}
          </div>
          {actions && <div className="sec-card-actions">{actions}</div>}
        </div>
      )}
      {children}
    </Card>
  );
}

type Tone = 'primary' | 'success' | 'warning' | 'danger';

export function StatCard({
  label,
  value,
  helper,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  helper: string;
  tone?: Tone;
}) {
  return (
    <Card className={cn('sec-stat', `tone-${tone}`)}>
      <p className="sec-stat-label">{label}</p>
      <p className="sec-stat-value">{value}</p>
      <p className="sec-stat-helper">{helper}</p>
    </Card>
  );
}

export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  return <div className={`sec-grid sec-cols-${columns}`}>{children}</div>;
}
