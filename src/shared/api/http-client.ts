import axios from 'axios';
import { appConfig } from '../config/app-config';

export const httpClient = axios.create({
  baseURL: appConfig.apiBaseUrl || undefined,
  withCredentials: true,
  timeout: 15000,
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

httpClient.interceptors.request.use((config) => {
  console.log("AXIOS REQUEST:", {
    url: config.url,
    baseURL: config.baseURL,
    withCredentials: config.withCredentials,
  });

  return config;
}
)
  