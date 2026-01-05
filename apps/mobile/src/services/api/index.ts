export { apiClient, getErrorMessage, getErrorCode, API_ERROR_CODES } from './client';
export { authApi } from './auth';
export { claimsApi } from './claims';
export { vehiclesApi } from './vehicles';
export { notificationsApi } from './notifications';

// Re-export types
export type { ClaimListItem, ClaimDetail, CreateClaimInput, ClaimFilters, PaginatedResponse } from './claims';
export type { Vehicle } from './vehicles';
export type { Notification, NotificationsResponse } from './notifications';
