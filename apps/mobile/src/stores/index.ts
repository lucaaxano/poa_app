export {
  useAuthStore,
  selectUser,
  selectCompany,
  selectIsAuthenticated,
  selectIsLoading,
  selectIsInitialized,
  getUserFullName,
  getUserInitials,
} from './authStore';

export {
  useNetworkStore,
  selectIsConnected,
  selectIsInternetReachable,
  selectIsOffline,
} from './networkStore';

export {
  useNotificationStore,
  selectUnreadCount,
  selectHasUnread,
} from './notificationStore';

export {
  useClaimDraftStore,
  // Granular selectors for performance optimization
  useClaimDraftVehicle,
  useClaimDraftDate,
  useClaimDraftTime,
  useClaimDraftLocation,
  useClaimDraftGpsCoords,
  useClaimDraftCategory,
  useClaimDraftDescription,
  useClaimDraftPhotos,
  useClaimDraftCurrentStep,
  useClaimDraftIsDirty,
  useClaimDraftActions,
} from './claimDraftStore';
export type { ClaimDraftVehicle, ClaimDraftPhoto, ClaimDraftData } from './claimDraftStore';
