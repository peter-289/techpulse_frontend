import { useCallback } from 'react';
import { notifyToast } from '../../toastBus';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

/**
 * Hook to display toast notifications using the application's toast bus
 * @returns Function to display a toast notification
 */
export function useToast() {
  return useCallback((options: ToastOptions) => {
    notifyToast({
      variant: options.variant,
      title: options.title,
      description: options.description,
      duration: options.duration || 3000,
    });
  }, []);
}
