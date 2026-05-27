import React, { useEffect, useState } from 'react';
import FeedbackMessage from './FeedbackMessage';
import { subscribeToToasts } from '../toastBus';
import './AppToasts.css';

export default function AppToasts() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeToToasts((toast) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const next = {
        id,
        variant: toast.variant || 'info',
        title: toast.title || '',
        message: toast.message || '',
      };
      setToasts((prev) => [next, ...prev].slice(0, 4));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, toast.timeout || 5200);
    });
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="tp-toast-stack" aria-live="polite" aria-label="Application messages">
      {toasts.map((toast) => (
        <FeedbackMessage
          key={toast.id}
          {...toast}
          floating={false}
          onClose={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
        />
      ))}
    </div>
  );
}
