declare module './toastBus' {
  export function notifyToast(toast: any): void;
  export function subscribeToToasts(handler: (toast: any) => void): () => void;
  export function errorMessageFrom(err: any, fallback?: string): string;
}
