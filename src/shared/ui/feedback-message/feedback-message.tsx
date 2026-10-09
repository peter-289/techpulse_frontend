import type { ReactNode } from 'react';
import './feedback-message.css';

type FeedbackVariant = 'success' | 'error' | 'warning' | 'info';

const ICONS: Record<FeedbackVariant, string> = {
  success: '?',
  error: '!',
  warning: '!',
  info: 'i',
};

export interface FeedbackMessageProps {
  variant?: FeedbackVariant;
  title?: string;
  message?: string;
  onClose?: () => void;
  floating?: boolean;
  compact?: boolean;
  className?: string;
  role?: string;
  children?: ReactNode;
}

export default function FeedbackMessage({
  variant = 'info',
  title,
  message,
  onClose,
  floating = false,
  compact = false,
  className = '',
  role,
}: FeedbackMessageProps) {
  if (!message) return null;

  const ariaRole = role || (variant === 'error' ? 'alert' : 'status');
  const safeVariant: FeedbackVariant = (
    ['success', 'error', 'warning', 'info'] as const
  ).includes(variant as FeedbackVariant)
    ? (variant as FeedbackVariant)
    : 'info';

  return (
    <section
      className={`tp-feedback tp-feedback-${safeVariant} ${floating ? 'tp-feedback-floating' : ''} ${compact ? 'tp-feedback-compact' : ''} ${className}`.trim()}
      role={ariaRole}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <span className="tp-feedback-icon" aria-hidden="true">
        {ICONS[safeVariant]}
      </span>
      <div className="tp-feedback-copy">
        {title && <h4>{title}</h4>}
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          className="tp-feedback-close"
          onClick={onClose}
          aria-label="Dismiss message"
        >
          &times;
        </button>
      )}
    </section>
  );
}
