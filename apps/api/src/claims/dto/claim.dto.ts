import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DamageCategory, ClaimStatus } from '@poa/database';

// Third Party Info DTO
export class ThirdPartyInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  licensePlate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ownerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  insurerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyNumber?: string;
}

// Witness Info DTO
export class WitnessInfoDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;
}

// Create Claim DTO
export class CreateClaimDto {
  @IsUUID('4', { message: 'Ungueltige Fahrzeug-ID' })
  vehicleId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Ungueltige Policy-ID' })
  policyId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Ungueltige Fahrer-ID' })
  driverUserId?: string;

  @IsDateString({}, { message: 'Ungueltiges Datum' })
  accidentDate: string;

  @IsOptional()
  @IsString()
  accidentTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Unfallort darf maximal 500 Zeichen haben' })
  accidentLocation?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  gpsLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  gpsLng?: number;

  @IsEnum(DamageCategory, { message: 'Ungueltige Schadenkategorie' })
  damageCategory: DamageCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  damageSubcategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Beschreibung darf maximal 5000 Zeichen haben' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  policeInvolved?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  policeFileNumber?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  hasInjuries?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  injuryDetails?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ThirdPartyInfoDto)
  thirdPartyInfo?: ThirdPartyInfoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WitnessInfoDto)
  witnessInfo?: WitnessInfoDto[];

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Kosten muessen positiv sein' })
  @Transform(({ value }) => (value === '' || value === null ? undefined : Number(value)))
  estimatedCost?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  submitImmediately?: boolean;
}

// Update Claim DTO
export class UpdateClaimDto {
  @IsOptional()
  @IsUUID('4', { message: 'Ungueltige Fahrzeug-ID' })
  vehicleId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Ungueltige Policy-ID' })
  policyId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Ungueltige Fahrer-ID' })
  driverUserId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ungueltiges Datum' })
  accidentDate?: string;

  @IsOptional()
  @IsString()
  accidentTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Unfallort darf maximal 500 Zeichen haben' })
  accidentLocation?: string;

  @IsOptional()
  @IsNumber()
  gpsLat?: number;

  @IsOptional()
  @IsNumber()
  gpsLng?: number;

  @IsOptional()
  @IsEnum(DamageCategory, { message: 'Ungueltige Schadenkategorie' })
  damageCategory?: DamageCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  damageSubcategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Beschreibung darf maximal 5000 Zeichen haben' })
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  policeInvolved?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  policeFileNumber?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  hasInjuries?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  injuryDetails?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ThirdPartyInfoDto)
  thirdPartyInfo?: ThirdPartyInfoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WitnessInfoDto)
  witnessInfo?: WitnessInfoDto[];

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Kosten muessen positiv sein' })
  @Transform(({ value }) => (value === '' || value === null ? undefined : Number(value)))
  estimatedCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Kosten muessen positiv sein' })
  @Transform(({ value }) => (value === '' || value === null ? undefined : Number(value)))
  finalCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  insurerClaimNumber?: string;
}

// Reject Claim DTO
export class RejectClaimDto {
  @IsString()
  @MaxLength(1000, { message: 'Ablehnungsgrund darf maximal 1000 Zeichen haben' })
  rejectionReason: string;
}

// Claim Filter/Query DTO
export class ClaimFilterDto {
  @IsOptional()
  @IsArray()
  @IsEnum(ClaimStatus, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  status?: ClaimStatus[];

  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @IsOptional()
  @IsUUID('4')
  driverUserId?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(DamageCategory, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  damageCategory?: DamageCategory[];

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 20)
  pageSize?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
