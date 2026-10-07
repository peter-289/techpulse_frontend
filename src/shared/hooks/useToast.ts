import { useCallback } from 'react';
import { notifyToast } from '@/shared/lib/toast/toast';

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
    const variantMap: Record<ToastVariant, 'default' | 'success' | 'warning' | 'destructive'> = {
      success: 'success',
      error: 'destructive',
      warning: 'warning',
      info: 'default',
    };
    notifyToast({
      variant: variantMap[options.variant],
      title: options.title,
      ...(options.description !== undefined ? { description: options.description } : {}),
      duration: options.duration || 3000,
    });
  }, []);
}
