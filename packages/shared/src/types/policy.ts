// Policy & Insurer Types

export enum CoverageType {
  FLEET = 'FLEET',
  SINGLE = 'SINGLE',
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',
}

export enum PricingModel {
  QUOTA = 'QUOTA',
  PER_PIECE = 'PER_PIECE',
  SMALL_FLEET = 'SMALL_FLEET',
}

export interface Insurer {
  id: string;
  name: string;
  claimsEmail: string;
  contactPhone: string | null;
  website: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Policy {
  id: string;
  companyId: string;
  insurerId: string;
  policyNumber: string;
  coverageType: CoverageType;
  pricingModel: PricingModel | null;
  annualPremium: number | null;
  deductible: number | null;
  quotaThreshold: number | null;
  validFrom: Date;
  validTo: Date | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyWithInsurer extends Policy {
  insurer: Insurer;
}

export interface CreatePolicyInput {
  insurerId: string;
  policyNumber: string;
  coverageType: CoverageType;
  pricingModel?: PricingModel;
  annualPremium?: number;
  deductible?: number;
  quotaThreshold?: number;
  validFrom: Date;
  validTo?: Date;
  notes?: string;
}

export interface UpdatePolicyInput {
  insurerId?: string;
  policyNumber?: string;
  coverageType?: CoverageType;
  pricingModel?: PricingModel;
  annualPremium?: number;
  deductible?: number;
  quotaThreshold?: number;
  validFrom?: Date;
  validTo?: Date;
  notes?: string;
  isActive?: boolean;
}

export interface QuotaInfo {
  totalClaims: number;
  totalClaimsCost: number;
  annualPremium: number;
  quotaPercentage: number;
  quotaThreshold: number;
  isOverThreshold: boolean;
}
