// Constants and enums for the POA application

import { ClaimStatus, DamageCategory } from '../types/claim';
import { VehicleType } from '../types/vehicle';
import { CoverageType, PricingModel } from '../types/policy';
import { UserRole } from '../types/user';

// Claim Status Labels (German)
export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  [ClaimStatus.DRAFT]: 'Entwurf',
  [ClaimStatus.SUBMITTED]: 'Eingereicht',
  [ClaimStatus.APPROVED]: 'Freigegeben',
  [ClaimStatus.SENT]: 'An Versicherung gesendet',
  [ClaimStatus.ACKNOWLEDGED]: 'Von Versicherung bestätigt',
  [ClaimStatus.CLOSED]: 'Abgeschlossen',
  [ClaimStatus.REJECTED]: 'Abgelehnt',
};

// Claim Status Colors (for UI)
export const CLAIM_STATUS_COLORS: Record<ClaimStatus, string> = {
  [ClaimStatus.DRAFT]: 'gray',
  [ClaimStatus.SUBMITTED]: 'blue',
  [ClaimStatus.APPROVED]: 'green',
  [ClaimStatus.SENT]: 'purple',
  [ClaimStatus.ACKNOWLEDGED]: 'indigo',
  [ClaimStatus.CLOSED]: 'gray',
  [ClaimStatus.REJECTED]: 'red',
};

// Damage Category Labels (German)
export const DAMAGE_CATEGORY_LABELS: Record<DamageCategory, string> = {
  [DamageCategory.LIABILITY]: 'Haftpflichtschaden',
  [DamageCategory.COMPREHENSIVE]: 'Kaskoschaden',
  [DamageCategory.GLASS]: 'Glasschaden',
  [DamageCategory.WILDLIFE]: 'Wildschaden',
  [DamageCategory.PARKING]: 'Parkschaden',
  [DamageCategory.THEFT]: 'Diebstahl',
  [DamageCategory.VANDALISM]: 'Vandalismus',
  [DamageCategory.OTHER]: 'Sonstiges',
};

// Vehicle Type Labels (German)
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  [VehicleType.CAR]: 'PKW',
  [VehicleType.TRUCK]: 'LKW',
  [VehicleType.VAN]: 'Transporter',
  [VehicleType.MOTORCYCLE]: 'Motorrad',
  [VehicleType.OTHER]: 'Sonstiges',
};

// Coverage Type Labels (German)
export const COVERAGE_TYPE_LABELS: Record<CoverageType, string> = {
  [CoverageType.FLEET]: 'Flottenvertrag',
  [CoverageType.SINGLE]: 'Einzelvertrag',
  [CoverageType.PARTIAL]: 'Teilkasko',
  [CoverageType.FULL]: 'Vollkasko',
};

// Pricing Model Labels (German)
export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  [PricingModel.QUOTA]: 'Quotenmodell',
  [PricingModel.PER_PIECE]: 'Stückpreismodell',
  [PricingModel.SMALL_FLEET]: 'Kleinflotte',
};

// User Role Labels (German)
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.EMPLOYEE]: 'Mitarbeiter',
  [UserRole.COMPANY_ADMIN]: 'Administrator',
  [UserRole.BROKER]: 'Versicherungsmakler',
  [UserRole.SUPERADMIN]: 'System-Administrator',
};

// Pagination Defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// File Upload Limits
export const FILE_UPLOAD_LIMITS = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_DOCUMENT_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime', 'video/webm'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
} as const;

// Token Expiry
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '15m',
  REFRESH_TOKEN: '7d',
  EMAIL_VERIFICATION: '24h',
  PASSWORD_RESET: '1h',
  INVITATION: '7d',
} as const;
