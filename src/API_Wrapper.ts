import axios from 'axios';
import { notifyToast } from './toastBus';

const envBaseUrl = (
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL || import.meta.env?.REACT_APP_API_URL)) || ''
).trim();
const isLocalFrontend =
  typeof window !== 'undefined' &&
  (window.location.origin.includes('localhost:5173') || window.location.origin.includes('127.0.0.1:5173'));
const fallbackBaseUrl = isLocalFrontend ? 'http://127.0.0.1:8000' : '';

export const API_BASE_URL = (envBaseUrl || fallbackBaseUrl).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
});

export const authApi = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
});

let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = (error && error.config) || {};
    const status = error?.response?.status;
    const url = String(originalRequest?.url || '');

    if (
      status === 401 &&
      !originalRequest._retry &&
      !url.includes('/api/v1/auth/login') &&
      !url.includes('/api/v1/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = authApi.post('/api/v1/auth/refresh').finally(() => {
          isRefreshing = false;
        });
      }

      try {
        await refreshPromise;
        return authApi(originalRequest);
      } catch (refreshError) {
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
