import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CoverageType, PricingModel } from '@poa/database';

export class CreatePolicyDto {
  @IsString()
  insurerId: string;

  @IsString()
  @MaxLength(100, { message: 'Policennummer darf maximal 100 Zeichen haben' })
  policyNumber: string;

  @IsOptional()
  @IsEnum(CoverageType, { message: 'Ungültiger Deckungstyp' })
  coverageType?: CoverageType;

  @IsOptional()
  @IsEnum(PricingModel, { message: 'Ungültiges Preismodell' })
  pricingModel?: PricingModel;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Jahrespraemie muss positiv sein' })
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  annualPremium?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Selbstbeteiligung muss positiv sein' })
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  deductible?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  quotaThreshold?: number;

  @IsDateString()
  validFrom: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Notizen dürfen maximal 1000 Zeichen haben' })
  notes?: string;
}

export class UpdatePolicyDto {
  @IsOptional()
  @IsString()
  insurerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Policennummer darf maximal 100 Zeichen haben' })
  policyNumber?: string;

  @IsOptional()
  @IsEnum(CoverageType, { message: 'Ungültiger Deckungstyp' })
  coverageType?: CoverageType;

  @IsOptional()
  @IsEnum(PricingModel, { message: 'Ungültiges Preismodell' })
  pricingModel?: PricingModel;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Jahrespraemie muss positiv sein' })
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  annualPremium?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Selbstbeteiligung muss positiv sein' })
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  deductible?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  quotaThreshold?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Notizen dürfen maximal 1000 Zeichen haben' })
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
