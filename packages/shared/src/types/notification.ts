// Notification Types

export enum NotificationType {
  NEW_CLAIM = 'NEW_CLAIM',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  CLAIM_SENT = 'CLAIM_SENT',
  NEW_COMMENT = 'NEW_COMMENT',
  INVITATION = 'INVITATION',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationData {
  claimId?: string;
  claimNumber?: string;
  companyId?: string;
  invitationId?: string;
  link?: string;
}

export interface NotificationPreferences {
  emailNewClaim: boolean;
  emailClaimApproved: boolean;
  emailClaimRejected: boolean;
  emailNewComment: boolean;
  emailDigest: 'none' | 'daily' | 'weekly';
  pushEnabled: boolean;
}
