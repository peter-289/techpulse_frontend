import axios from 'axios';
import { notifyToast } from './toastBus';

const envBaseUrl = (
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.REACT_APP_API_URL)) || ''
).trim();
const isLocalFrontend =
  typeof window !== 'undefined' &&
  (window.location.origin.includes('localhost:5173') || window.location.origin.includes('127.0.0.1:5173'));
const fallbackBaseUrl = isLocalFrontend ? 'http://localhost:8000' : '';

export const API_BASE_URL = (envBaseUrl || fallbackBaseUrl).replace(/\/$/, '');

// Single authenticated client instance
export const authApi = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
});

// Use same instance for api exports
const api = authApi;

let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = (error && error.config) || {};
    const status = error?.response?.status;
    const url = String(originalRequest?.url || '');

    console.log('API Error:', {
      url,
      status,
      statusText: error?.response?.statusText,
      detail: error?.response?.data?.detail,
      isRetry: originalRequest._retry,
    });

    if (
      status === 401 &&
      !originalRequest._retry &&
      !url.includes('/api/v1/auth/login') &&
      !url.includes('/api/v1/auth/refresh')
    ) {
      console.log('Attempting token refresh for 401 on:', url);
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = authApi.post('/api/v1/auth/refresh').finally(() => {
          isRefreshing = false;
        });
      }

      try {
        await refreshPromise;
        console.log('Token refresh successful, retrying:', url);
        return authApi(originalRequest);
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    if (!status) {
      notifyToast({
        variant: 'error',
        title: 'Network unavailable',
        message: 'We could not reach the server. Check your connection and try again.',
      });
    } else if (status >= 500) {
      notifyToast({
        variant: 'error',
        title: 'Server error',
        message: error?.response?.data?.detail || 'The server could not complete that request.',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
