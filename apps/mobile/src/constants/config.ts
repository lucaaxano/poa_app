/**
 * POA Mobile App - Configuration
 * API URLs, Timeouts, und andere Einstellungen
 */

// API Configuration
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
export const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10);

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'poa_access_token',
  REFRESH_TOKEN: 'poa_refresh_token',
  USER_DATA: 'poa_user_data',
  DRAFT_CLAIM: 'poa_draft_claim',
  OFFLINE_QUEUE: 'poa_offline_queue',
} as const;

// Sync Configuration
export const SYNC_CONFIG = {
  INTERVAL_MS: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
} as const;

// Upload Limits
export const UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 100,
  MAX_DOCUMENT_SIZE_MB: 20,
  MAX_IMAGES_PER_CLAIM: 20,
  IMAGE_COMPRESSION_QUALITY: 0.7,
  IMAGE_MAX_WIDTH: 1920,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  STALE_TIME_MS: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME_MS: 30 * 60 * 1000, // 30 minutes
} as const;

// App Info
export const APP_INFO = {
  NAME: 'POA',
  FULL_NAME: 'Point-of-Accident',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@poa-app.de',
  PRIVACY_URL: 'https://poa-app.de/datenschutz',
  TERMS_URL: 'https://poa-app.de/agb',
} as const;
