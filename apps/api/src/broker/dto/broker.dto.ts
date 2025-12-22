import { IsOptional, IsUUID, IsInt, Min, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimStatus } from '@poa/database';

// Response DTOs
export interface CompanyWithStats {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  totalClaims: number;
  totalVehicles: number;
  pendingClaims: number;
}

export interface BrokerAggregatedStats {
  totalCompanies: number;
  totalClaims: number;
  totalVehicles: number;
  totalUsers: number;
  claimsByStatus: Record<string, number>;
  claimsByCompany: Array<{
    companyId: string;
    companyName: string;
    claimCount: number;
    pendingCount: number;
  }>;
}

export interface BrokerCompanyStats {
  totalClaims: number;
  totalVehicles: number;
  totalUsers: number;
  claimsByStatus: Record<string, number>;
}

// Request DTOs
export class BrokerClaimFilterDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

// Claim with Company info for Broker responses
export interface BrokerClaimListItem {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  accidentDate: Date;
  accidentLocation: string | null;
  damageCategory: string;
  estimatedCost: number | null;
  createdAt: Date;
  company: {
    id: string;
    name: string;
  };
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
  };
}

export interface PaginatedBrokerClaims {
  data: BrokerClaimListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
