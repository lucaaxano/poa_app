import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// =============================================
// TIMEOUT CONFIGURATION - Differentiated by endpoint type
// =============================================
// Auth endpoints need longer timeouts due to potential DB warmup + bcrypt
// Default endpoints get standard timeout
// Quick endpoints for fast operations
const TIMEOUT_CONFIG = {
  auth: 45000,      // 45s for Login/Logout (increased for cold starts with DB warmup + bcrypt)
  default: 30000,   // 30s standard (increased from 15s for concurrent dashboard requests)
  quick: 5000,      // 5s for health checks and fast endpoints
};

// =============================================
// LOGOUT FLAG - Prevents API calls during logout
// =============================================
let isLoggingOut = false;

/**
 * Set logout state - call this before clearing tokens
 * This prevents pending API calls from causing timeout errors
 */
export const setLoggingOut = (value: boolean): void => {
  isLoggingOut = value;
  // When starting logout, immediately abort all pending requests
  if (value) {
    abortAllPendingRequests();
  }
};

/**
 * Check if currently logging out
 */
export const getLoggingOut = (): boolean => isLoggingOut;

// =============================================
// GLOBAL REQUEST ABORTION - For instant logout
// =============================================
// Track all pending request AbortControllers for aggressive cancellation
let pendingRequestControllers = new Set<AbortController>();

/**
 * Register a request's AbortController for potential cancellation
 */
const registerPendingRequest = (controller: AbortController): void => {
  pendingRequestControllers.add(controller);
};

/**
 * Unregister a completed request's AbortController
 */
const unregisterPendingRequest = (controller: AbortController): void => {
  pendingRequestControllers.delete(controller);
};

/**
 * Abort ALL pending requests immediately
 * Called on logout for instant cleanup
 */
export const abortAllPendingRequests = (): void => {
  pendingRequestControllers.forEach(controller => {
    try {
      controller.abort();
    } catch {
      // Ignore abort errors
    }
  });
  pendingRequestControllers.clear();
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: TIMEOUT_CONFIG.default, // Default timeout, overridden per-request
});

// =============================================
// API WARMUP - Keep connection pool alive
// =============================================

let warmupInterval: ReturnType<typeof setInterval> | null = null;
let isApiWarmedUp = false;
let lastWarmupTime = 0;
let consecutiveFailures = 0;
let warmupPausedUntil = 0;

// Warmup configuration - minimal frequency to prevent slowdowns over time
// PERFORMANCE FIX: Increased intervals to reduce background API calls
const BASE_WARMUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (increased from 5)
const MIN_WARMUP_INTERVAL_MS = 5 * 60 * 1000; // Minimum 5 minutes between warmups
const MAX_PAUSE_DURATION_MS = 5 * 60 * 1000; // Max 5 minutes pause after failures
const MAX_CONSECUTIVE_FAILURES = 3; // Pause after 3 failures

// Store visibility change handler reference for proper cleanup
let visibilityChangeHandler: (() => void) | null = null;

/**
 * Warm up the API connection - call this before critical operations
 * Returns quickly and warms up in background if needed
 * Includes exponential backoff on failures to prevent server overload
 * @param force - Skip the minimum interval check (used for visibility change)
 */
export const warmupApi = async (force = false): Promise<boolean> => {
  // Skip if tab is not visible - no background warmup
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    return isApiWarmedUp;
  }

  // Skip if warmup is paused due to failures (unless forced)
  if (!force && Date.now() < warmupPausedUntil) {
    return isApiWarmedUp;
  }

  // Skip if recently warmed up (within MIN_WARMUP_INTERVAL_MS) unless forced
  if (!force && Date.now() - lastWarmupTime < MIN_WARMUP_INTERVAL_MS) {
    return isApiWarmedUp;
  }

  // Skip if logging out
  if (isLoggingOut) {
    return isApiWarmedUp;
  }

  try {
    const response = await axios.get(`${API_URL}/warmup`, {
      timeout: 5000, // 5 second timeout for warmup
    });
    isApiWarmedUp = response.data?.warmedUp ?? true;
    lastWarmupTime = Date.now();
    consecutiveFailures = 0; // Reset failures on success
    warmupPausedUntil = 0;
    return true;
  } catch {
    consecutiveFailures++;

    // After MAX_CONSECUTIVE_FAILURES, pause warmup with exponential backoff
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      const pauseDuration = Math.min(
        BASE_WARMUP_INTERVAL_MS * Math.pow(2, consecutiveFailures - MAX_CONSECUTIVE_FAILURES),
        MAX_PAUSE_DURATION_MS
      );
      warmupPausedUntil = Date.now() + pauseDuration;
      // Silent pause - warmup is just a background optimization
    }

    // Silent failure - warmup failures are expected during cold starts
    // and shouldn't spam the console
    return false;
  }
};

/**
 * Start periodic API warmup to prevent cold starts
 * Call this when the app initializes
 * Only performs warmup when user is authenticated (has tokens)
 */
export const startApiWarmup = (): void => {
  if (typeof window === 'undefined') return;

  // Don't start multiple intervals
  if (warmupInterval) return;

  // Reset state
  consecutiveFailures = 0;
  warmupPausedUntil = 0;

  // Only do initial warmup if authenticated (has token) and tab is visible
  // This prevents unnecessary warmup failures on the login page after deploy
  const hasToken = !!getAccessToken();
  if (hasToken && document.visibilityState === 'visible') {
    // Small delay to allow backend to be ready after cold start
    setTimeout(() => warmupApi().catch(() => {}), 1000);
  }

  // Periodic warmup - only executes if authenticated and conditions are met
  warmupInterval = setInterval(() => {
    // Only warmup if authenticated
    if (getAccessToken()) {
      warmupApi().catch(() => {});
    }
  }, BASE_WARMUP_INTERVAL_MS);

  // Visibility handler - warmup when user returns to tab
  // Simple and direct - no requestIdleCallback to avoid accumulating deferred work
  if (!visibilityChangeHandler) {
    visibilityChangeHandler = () => {
      // Only warmup if authenticated and visible
      if (document.visibilityState === 'visible' && !isLoggingOut && getAccessToken()) {
        // Warmup when returning to tab if more than 30s since last warmup
        const timeSinceLastWarmup = Date.now() - lastWarmupTime;
        if (timeSinceLastWarmup > 30000) { // 30 seconds threshold
          // Direct call - simple and predictable
          warmupApi(true).catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', visibilityChangeHandler, { passive: true });
  }
};

/**
 * Stop periodic API warmup (for cleanup)
 */
export const stopApiWarmup = (): void => {
  if (warmupInterval) {
    clearInterval(warmupInterval);
    warmupInterval = null;
  }

  // Remove visibility change handler to prevent memory leaks
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
    visibilityChangeHandler = null;
  }

  // Reset state
  consecutiveFailures = 0;
  warmupPausedUntil = 0;
};

/**
 * Check if API is warmed up
 */
export const isApiReady = (): boolean => isApiWarmedUp;

/**
 * Ensure API is ready before critical operations like login
 * This function will retry multiple times with increasing delays
 * Returns true if API is ready, false if all attempts failed
 *
 * Use this before login to prevent timeout errors during cold starts
 */
export const ensureApiReady = async (maxAttempts = 2): Promise<boolean> => {
  // Skip if logging out
  if (isLoggingOut) {
    return false;
  }

  // Skip if recently warmed up (within 30 seconds)
  if (isApiWarmedUp && lastWarmupTime && (Date.now() - lastWarmupTime < 30000)) {
    return true;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${API_URL}/warmup`, {
        timeout: 5000, // 5 second timeout (reduced from 10s)
      });

      if (response.data?.status === 'ok') {
        isApiWarmedUp = true;
        lastWarmupTime = Date.now();
        consecutiveFailures = 0;
        warmupPausedUntil = 0;
        return true;
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        console.warn(`[API] Warmup failed after ${maxAttempts} attempts, proceeding anyway`);
      }
    }

    // Fixed 1 second delay between attempts (simplified from attempt * 1000)
    if (attempt < maxAttempts) {
      await sleep(1000);
    }
  }

  // Return false but don't block - let the actual request try
  return false;
};

/**
 * Reset warmup state - call this after successful API calls
 * This helps recover from temporary failures
 */
export const resetWarmupState = (): void => {
  consecutiveFailures = 0;
  warmupPausedUntil = 0;
  isApiWarmedUp = true;
  lastWarmupTime = Date.now();
};

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

// Request interceptor - add auth header, set dynamic timeout, track requests, and check token expiry
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip request if logging out - prevents timeout errors
    if (isLoggingOut) {
      const controller = new AbortController();
      controller.abort();
      config.signal = controller.signal;
      return config;
    }

    // Create AbortController for this request and register it
    // This allows us to abort all pending requests on logout
    const controller = new AbortController();
    config.signal = controller.signal;
    registerPendingRequest(controller);
    // Store controller reference for cleanup in response interceptor
    (config as InternalAxiosRequestConfig & { _abortController?: AbortController })._abortController = controller;

    // Apply differentiated timeouts based on endpoint type
    // Auth endpoints need longer timeouts due to potential DB warmup + bcrypt
    if (config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/register') ||
        config.url?.includes('/auth/2fa')) {
      config.timeout = TIMEOUT_CONFIG.auth;
    } else if (config.url?.includes('/health') || config.url?.includes('/warmup')) {
      config.timeout = TIMEOUT_CONFIG.quick;
    }
    // Other requests use the default timeout from axios create

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

/**
 * Reset auth state on logout - clears pending refresh queue
 * This prevents accumulated requests from blocking logout
 */
export const resetAuthState = (): void => {
  // Reject all pending requests in the failed queue
  failedQueue.forEach((promise) => {
    promise.reject(new Error('Logged out'));
  });
  failedQueue = [];
  isRefreshing = false;
};

// Custom event for session expiry notification
export const SESSION_EXPIRED_EVENT = 'poa:session-expired';

const notifySessionExpired = (reason: 'auth_failed' | 'server_error' | 'network_error') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason } }));
  }
};

apiClient.interceptors.response.use(
  (response) => {
    // Unregister the AbortController for this completed request
    const config = response.config as InternalAxiosRequestConfig & { _abortController?: AbortController };
    if (config._abortController) {
      unregisterPendingRequest(config._abortController);
    }

    // Reset warmup state on successful responses - helps recover from temporary failures
    if (consecutiveFailures > 0) {
      consecutiveFailures = 0;
      warmupPausedUntil = 0;
      isApiWarmedUp = true;
      lastWarmupTime = Date.now();
    }
    return response;
  },
  async (error: AxiosError) => {
    // Unregister the AbortController for this failed request
    const errorConfig = error.config as InternalAxiosRequestConfig & { _abortController?: AbortController } | undefined;
    if (errorConfig?._abortController) {
      unregisterPendingRequest(errorConfig._abortController);
    }

    // If logging out, don't retry or process errors - just reject silently
    if (isLoggingOut) {
      return Promise.reject(new Error('Request cancelled due to logout'));
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // Check if this is a CORS error (caused by 504 timeout from proxy)
    // CORS errors have no response (error.response is undefined) and typically have
    // code 'ERR_NETWORK' or message contains 'Network Error'
    const isCorsOrNetworkError = !error.response && (
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('CORS')
    );

    // Handle network/CORS errors (often caused by proxy timeouts)
    if (isCorsOrNetworkError) {
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < 2) { // Reduced from 3 to 2 retries for faster failure
        originalRequest._retryCount = retryCount + 1;
        const delay = 500 * Math.pow(2, retryCount); // 500ms, 1s (faster recovery)

        console.warn(`[API] Network/CORS error (attempt ${retryCount + 1}/2), retrying in ${delay}ms...`);

        // Skip warmupApi() before retry - it adds unnecessary delay
        await sleep(delay);

        return apiClient(originalRequest);
      }
      // After retries failed, don't logout - just report error
      console.error('[API] Network error persists after retries');
      return Promise.reject(error);
    }

    // Handle Axios timeout errors (ECONNABORTED)
    // These occur when the request exceeds the configured timeout
    if (error.code === 'ECONNABORTED' && error.message?.includes('timeout')) {
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < 2) {
        originalRequest._retryCount = retryCount + 1;
        // Longer delay for timeout errors - server might be under load
        const delay = 1000 * (retryCount + 1); // 1s, 2s

        console.warn(`[API] Request timeout (attempt ${retryCount + 1}/2), retrying in ${delay}ms...`);

        await sleep(delay);
        return apiClient(originalRequest);
      }
      console.error('[API] Request timeout persists after retries');
      return Promise.reject(error);
    }

    // Handle 5xx errors separately - don't treat as auth errors
    const status = error.response?.status;

    // Special handling for 504 Gateway Timeout - use faster retry
    // 504 often means the backend was temporarily slow but is now ready
    if (status === 504) {
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < 2) {
        originalRequest._retryCount = retryCount + 1;
        // Faster retry for 504 - backend is likely ready now
        const delay = 300 * (retryCount + 1); // 300ms, 600ms

        console.warn(`[API] Gateway timeout 504 (attempt ${retryCount + 1}/2), quick retry in ${delay}ms...`);

        await sleep(delay);
        return apiClient(originalRequest);
      }
      // After retries, don't freeze - just report error
      console.error('[API] Gateway timeout persists after retries');
      return Promise.reject(error);
    }

    if (status && status >= 500) {
      // For other server errors, we can retry the original request
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < 2) { // Reduced from 3 to 2 retries
        originalRequest._retryCount = retryCount + 1;
        const delay = 500 * Math.pow(2, retryCount); // 500ms, 1s (faster recovery)

        console.warn(`[API] Server error ${status} (attempt ${retryCount + 1}/2), retrying in ${delay}ms...`);

        // Skip warmupApi() before retry - it adds unnecessary delay
        await sleep(delay);

        return apiClient(originalRequest);
      }
      // After retries, notify about server error but don't logout
      notifySessionExpired('server_error');
      return Promise.reject(error);
    }

    // If error is 401 and we haven't tried to refresh yet
    // Skip refresh logic for auth endpoints - they handle their own 401 errors
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                           originalRequest.url?.includes('/auth/register') ||
                           originalRequest.url?.includes('/auth/forgot-password') ||
                           originalRequest.url?.includes('/auth/reset-password') ||
                           originalRequest.url?.includes('/auth/2fa/validate') ||
                           originalRequest.url?.includes('/auth/2fa/backup');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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
