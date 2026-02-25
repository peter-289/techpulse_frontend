import React from 'react';
import './FeedbackMessage.css';

const ICONS = {
  success: '?',
  error: '!',
  warning: '!',
  info: 'i',
};

export default function FeedbackMessage({
  variant = 'info',
  title,
  message,
  onClose,
  floating = false,
  compact = false,
  className = '',
  role,
}) {
  if (!message) return null;

  const ariaRole = role || (variant === 'error' ? 'alert' : 'status');
  const safeVariant = ['success', 'error', 'warning', 'info'].includes(variant) ? variant : 'info';

  return (
    <section
      className={`tp-feedback tp-feedback-${safeVariant} ${floating ? 'tp-feedback-floating' : ''} ${compact ? 'tp-feedback-compact' : ''} ${className}`.trim()}
      role={ariaRole}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <span className="tp-feedback-icon" aria-hidden="true">{ICONS[safeVariant]}</span>
      <div className="tp-feedback-copy">
        {title && <h4>{title}</h4>}
        <p>{message}</p>
      </div>
      {onClose && (
        <button type="button" className="tp-feedback-close" onClick={onClose} aria-label="Dismiss message">
          ×
        </button>
      )}
    </section>
  );
}
