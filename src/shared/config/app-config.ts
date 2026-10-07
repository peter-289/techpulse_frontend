/**
 * Application configuration
 */
export const appConfig = {
  appName: 'TechPulse Control Plane',
  /**
   * API base URL. Prefer VITE_API_URL (Vite). Falls back to empty string for relative paths (behind proxy).
   */
  apiBaseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '',
} as const;
