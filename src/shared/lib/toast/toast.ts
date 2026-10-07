export type ToastVariant = 'default' | 'success' | 'warning' | 'destructive';

export interface Toast {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

const EVENT_NAME = 'techpulse:toast';

/**
 * Emit a toast notification
 */
export function notifyToast(toast: Toast): void {
  if (typeof window === 'undefined') return;
  const id = toast.id ?? Math.random().toString(36).slice(2);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { ...toast, id } }));
}

/**
 * Subscribe to toast notifications
 */
export function subscribeToToasts(handler: (toast: Toast) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<Toast>;
    handler(customEvent.detail || {});
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

/**
 * Extract user-friendly error message from error object
 */
export function errorMessageFrom(
  err: any,
  fallback = 'Something went wrong. Please try again.'
): string {
  const detail = err?.response?.data?.detail ?? err?.details?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => item?.msg || item?.message || String(item))
      .join('\n');
  }
  const msg = err?.message ?? err?.response?.data?.message ?? err?.response?.data?.error;
  if (typeof msg === 'string') return msg;
  return fallback;
}
