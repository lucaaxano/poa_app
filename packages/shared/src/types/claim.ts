// Claim Types

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export enum DamageCategory {
  LIABILITY = 'LIABILITY',           // Haftpflichtschaden
  COMPREHENSIVE = 'COMPREHENSIVE',   // Kaskoschaden
  GLASS = 'GLASS',                   // Glasschaden
  WILDLIFE = 'WILDLIFE',             // Wildschaden
  PARKING = 'PARKING',               // Parkschaden
  THEFT = 'THEFT',                   // Diebstahl
  VANDALISM = 'VANDALISM',           // Vandalismus
  OTHER = 'OTHER',                   // Sonstiges
}

export enum ClaimEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  EMAIL_SENT = 'EMAIL_SENT',
  COMMENT_ADDED = 'COMMENT_ADDED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
  ATTACHMENT_REMOVED = 'ATTACHMENT_REMOVED',
  ASSIGNED = 'ASSIGNED',
}

export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  PDF = 'PDF',
  OTHER = 'OTHER',
}

export interface ThirdPartyInfo {
  licensePlate?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  insurerName?: string;
  policyNumber?: string;
}

export interface WitnessInfo {
  name: string;
  phone?: string;
  email?: string;
}

export interface Claim {
  id: string;
  companyId: string;
  vehicleId: string;
  policyId: string | null;
  reporterUserId: string;
  driverUserId: string | null;
  status: ClaimStatus;
  claimNumber: string;
  insurerClaimNumber: string | null;
  accidentDate: Date;
  accidentTime: Date | null;
  accidentLocation: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  damageCategory: DamageCategory;
  damageSubcategory: string | null;
  description: string | null;
  policeInvolved: boolean;
  policeFileNumber: string | null;
  hasInjuries: boolean;
  injuryDetails: string | null;
  thirdPartyInfo: ThirdPartyInfo | null;
  witnessInfo: WitnessInfo[] | null;
  estimatedCost: number | null;
  finalCost: number | null;
  rejectionReason: string | null;
  sentAt: Date | null;
  acknowledgedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimWithRelations extends Claim {
  vehicle: {
    id: string;
    licensePlate: string;
    brand: string | null;
    model: string | null;
  };
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  policy: {
    id: string;
    policyNumber: string;
    insurer: {
      id: string;
      name: string;
      claimsEmail: string;
    };
  } | null;
  attachments: ClaimAttachment[];
}

export interface ClaimAttachment {
  id: string;
  claimId: string;
  fileUrl: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

export interface ClaimEvent {
  id: string;
  claimId: string;
  userId: string | null;
  eventType: ClaimEventType;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ClaimComment {
  id: string;
  claimId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export interface CreateClaimInput {
  vehicleId: string;
  policyId?: string;
  driverUserId?: string;
  accidentDate: Date;
  accidentTime?: Date;
  accidentLocation?: string;
  gpsLat?: number;
  gpsLng?: number;
  damageCategory: DamageCategory;
  damageSubcategory?: string;
  description?: string;
  policeInvolved?: boolean;
  policeFileNumber?: string;
  hasInjuries?: boolean;
  injuryDetails?: string;
  thirdPartyInfo?: ThirdPartyInfo;
  witnessInfo?: WitnessInfo[];
  estimatedCost?: number;
}

export interface UpdateClaimInput {
  vehicleId?: string;
  policyId?: string;
  driverUserId?: string;
  accidentDate?: Date;
  accidentTime?: Date;
  accidentLocation?: string;
  gpsLat?: number;
  gpsLng?: number;
  damageCategory?: DamageCategory;
  damageSubcategory?: string;
  description?: string;
  policeInvolved?: boolean;
  policeFileNumber?: string;
  hasInjuries?: boolean;
  injuryDetails?: string;
  thirdPartyInfo?: ThirdPartyInfo;
  witnessInfo?: WitnessInfo[];
  estimatedCost?: number;
  finalCost?: number;
  insurerClaimNumber?: string;
}

export interface ClaimFilterParams {
  status?: ClaimStatus[];
  vehicleId?: string;
  driverUserId?: string;
  damageCategory?: DamageCategory[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
