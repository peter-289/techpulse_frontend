import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { appConfig } from '@/shared/config/app-config';
import { normalizeAxiosError } from '@/shared/lib/api/api-error';

/**
 * Base HTTP client configuration
 */
const httpClient: AxiosInstance = axios.create({
  baseURL: appConfig.apiBaseUrl || undefined,
  timeout: 15000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

let refreshPromise: Promise<void> | null = null;

/**
 * Refresh access token using refresh cookie
 */
async function refreshAccessToken(): Promise<void> {
  await httpClient.post('/api/v1/auth/refresh');
}

// Request interceptor
httpClient.interceptors.request.use(
  (config) => {
    // Do not override Content-Type for multipart/form-data
    if (config.data instanceof FormData && config.headers) {
      delete (config.headers as any)['Content-Type'];
    }
    if (import.meta.env.DEV) {
      console.debug('[HTTP] %s %s', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(normalizeAxiosError(error))
);

// Response interceptor
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (status === 401 && config && !config._retry) {
      const url = config.url ?? '';
      const isAuthEndpoint = /\/auth\/(login|refresh)/.test(url);
      if (isAuthEndpoint) {
        return Promise.reject(normalizeAxiosError(error));
      }

      config._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      try {
        await refreshPromise;
        return httpClient(config);
      } catch (refreshErr) {
        // Redirect to login on refresh failure
        if (typeof window !== 'undefined') {
          window.location.assign('/login');
        }
        return Promise.reject(normalizeAxiosError(refreshErr as AxiosError));
      }
    }
    return Promise.reject(normalizeAxiosError(error));
  }
);

/**
 * Unified HTTP client with auth refresh, timeout, and normalized errors
 */
export { httpClient };
export default httpClient;
