import type { ReactNode } from 'react';

export interface FeedbackMessageProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
  onClose?: () => void;
  floating?: boolean;
  compact?: boolean;
  className?: string;
  role?: string;
  children?: ReactNode;
}

declare const FeedbackMessage: (props: FeedbackMessageProps) => JSX.Element | null;

export default FeedbackMessage;

