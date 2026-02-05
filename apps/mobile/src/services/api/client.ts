/**
 * API Client
 * Axios-Instanz mit Token-Management (identisches Pattern wie Web-App)
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@/services/storage';
import { API_URL, API_TIMEOUT } from '@/constants/config';

// Custom config type with retry flag
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Create Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request Interceptor
 * Fuegt Authorization Header hinzu
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Behandelt 401 Fehler mit Token Refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Wenn kein 401 oder bereits retry, dann Fehler weiterleiten
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Wenn bereits refresh läuft, Request in Queue stellen
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Token refresh request (ohne Interceptor)
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });

      const { tokens } = response.data;
      await setTokens(tokens.accessToken, tokens.refreshToken);

      // Queue verarbeiten
      processQueue(null, tokens.accessToken);

      // Original Request wiederholen
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Queue mit Fehler verarbeiten
      processQueue(refreshError, null);

      // Tokens löschen
      await clearTokens();

      // Auth Store wird über Event informiert
      // (muss in AuthProvider implementiert werden)
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Error Message extrahieren
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || error.message || 'Ein unbekannter Fehler ist aufgetreten';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ein unbekannter Fehler ist aufgetreten';
};

/**
 * API Error Codes
 */
export const API_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

/**
 * Get Error Code from Axios Error
 */
export const getErrorCode = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return API_ERROR_CODES.NETWORK_ERROR;
    }
    switch (error.response.status) {
      case 401:
        return API_ERROR_CODES.UNAUTHORIZED;
      case 403:
        return API_ERROR_CODES.FORBIDDEN;
      case 404:
        return API_ERROR_CODES.NOT_FOUND;
      case 422:
        return API_ERROR_CODES.VALIDATION_ERROR;
      case 500:
      case 502:
      case 503:
        return API_ERROR_CODES.SERVER_ERROR;
      default:
        return API_ERROR_CODES.UNKNOWN;
    }
  }
  return API_ERROR_CODES.UNKNOWN;
};
