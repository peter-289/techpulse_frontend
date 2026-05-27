declare module '../components/FeedbackMessage' {
  import React from 'react';
  export interface FeedbackMessageProps {
    variant?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message?: string;
    onClose?: () => void;
    floating?: boolean;
    compact?: boolean;
    className?: string;
    role?: string;
  }
  const FeedbackMessage: React.FC<FeedbackMessageProps>;
  export default FeedbackMessage;
}

