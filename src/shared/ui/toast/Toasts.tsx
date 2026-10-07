import { useEffect, useState } from 'react';
import { subscribeToToasts, type Toast } from '@/shared/lib/toast/toast';
import './toasts.css';

/**
 * Toast notification container
 */
export function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((prev) => {
        const existing = prev.find((t) => t.id === toast.id);
        if (existing) return prev;
        return [...prev, toast];
      });
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    });
    return () => unsubscribe();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.variant ?? 'default'}`}
          role="alert"
        >
          {toast.title && <div className="toast__title">{toast.title}</div>}
          {toast.description && <div className="toast__description">{toast.description}</div>}
        </div>
      ))}
    </div>
  );
}
