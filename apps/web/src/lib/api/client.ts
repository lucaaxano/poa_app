import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'poa_access_token';
const REFRESH_TOKEN_KEY = 'poa_refresh_token';

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // Schedule proactive refresh when tokens are set
  scheduleProactiveRefresh(accessToken);
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // Clear any scheduled refresh
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

// JWT token parsing to get expiration time
const parseJwt = (token: string): { exp?: number; sub?: string } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Proactive token refresh - refresh 2 minutes before expiry
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
const REFRESH_BUFFER_MS = 2 * 60 * 1000; // 2 minutes before expiry

const scheduleProactiveRefresh = (accessToken: string) => {
  if (typeof window === 'undefined') return;

  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const payload = parseJwt(accessToken);
  if (!payload?.exp) return;

  const expiresAt = payload.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeUntilRefresh = expiresAt - now - REFRESH_BUFFER_MS;

  // Only schedule if there's time left (at least 10 seconds)
  if (timeUntilRefresh > 10000) {
    refreshTimer = setTimeout(async () => {
      try {
        await performTokenRefresh();
      } catch (error) {
        console.warn('Proactive token refresh failed:', error);
        // Don't redirect on proactive refresh failure - let the reactive handler deal with it
      }
    }, timeUntilRefresh);
  }
};

// Retry configuration for token refresh
const MAX_REFRESH_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Perform token refresh with retry logic
const performTokenRefresh = async (retryCount = 0): Promise<{ accessToken: string; refreshToken: string }> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });

    const { tokens } = response.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  } catch (error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;

    // For 5xx errors or network errors, retry with exponential backoff
    const isServerError = status && status >= 500;
    const isNetworkError = !axiosError.response && axiosError.code !== 'ECONNABORTED';

    if ((isServerError || isNetworkError) && retryCount < MAX_REFRESH_RETRIES) {
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.warn(`Token refresh failed (attempt ${retryCount + 1}/${MAX_REFRESH_RETRIES}), retrying in ${delay}ms...`);
      await sleep(delay);
      return performTokenRefresh(retryCount + 1);
    }

    // For 401/403 errors, don't retry - the refresh token is invalid
    throw error;
  }
};

// Request interceptor - add auth header and check token expiry
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

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

// Custom event for session expiry notification
export const SESSION_EXPIRED_EVENT = 'poa:session-expired';

const notifySessionExpired = (reason: 'auth_failed' | 'server_error' | 'network_error') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason } }));
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // Handle 5xx errors separately - don't treat as auth errors
    const status = error.response?.status;
    if (status && status >= 500) {
      // For server errors, we can retry the original request
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < 2) {
        originalRequest._retryCount = retryCount + 1;
        const delay = 1000 * Math.pow(2, retryCount);
        await sleep(delay);
        return apiClient(originalRequest);
      }
      // After retries, notify about server error but don't logout
      notifySessionExpired('server_error');
      return Promise.reject(error);
    }

    // If error is 401 and we haven't tried to refresh yet
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        notifySessionExpired('auth_failed');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const tokens = await performTokenRefresh();
        processQueue(null, tokens.accessToken);

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        const axiosRefreshError = refreshError as AxiosError;
        const refreshStatus = axiosRefreshError.response?.status;

        processQueue(refreshError, null);
        clearTokens();

        // Determine the reason for session expiry
        if (refreshStatus === 401 || refreshStatus === 403) {
          notifySessionExpired('auth_failed');
        } else if (refreshStatus && refreshStatus >= 500) {
          notifySessionExpired('server_error');
        } else if (!axiosRefreshError.response) {
          notifySessionExpired('network_error');
        } else {
          notifySessionExpired('auth_failed');
        }

        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Initialize proactive refresh on page load if token exists
if (typeof window !== 'undefined') {
  const token = getAccessToken();
  if (token) {
    scheduleProactiveRefresh(token);
  }
}

// API error type
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    return apiError?.message || error.message || 'Ein unbekannter Fehler ist aufgetreten';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ein unbekannter Fehler ist aufgetreten';
};
