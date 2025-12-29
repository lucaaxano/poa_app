import {
  IsString,
  IsArray,
  IsEnum,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DamageCategory } from '@poa/database';

/**
 * Chat message roles
 */
export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

/**
 * Single chat message
 */
export class ChatMessageDto {
  @IsEnum(ChatRole)
  role: ChatRole;

  @IsString()
  content: string;
}

/**
 * Request DTO for chat endpoint
 */
export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];
}

/**
 * Third party info extracted from chat
 */
export class ExtractedThirdPartyInfoDto {
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsOptional()
  @IsString()
  insurerName?: string;
}

/**
 * Extracted claim data from chat conversation
 */
export class ExtractedClaimDataDto {
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  vehicleLicensePlate?: string;

  @IsOptional()
  @IsString()
  accidentDate?: string;

  @IsOptional()
  @IsString()
  accidentTime?: string;

  @IsOptional()
  @IsString()
  accidentLocation?: string;

  @IsOptional()
  @IsEnum(DamageCategory)
  damageCategory?: DamageCategory;

  @IsOptional()
  @IsString()
  damageSubcategory?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  policeInvolved?: boolean;

  @IsOptional()
  @IsString()
  policeFileNumber?: string;

  @IsOptional()
  @IsBoolean()
  hasInjuries?: boolean;

  @IsOptional()
  @IsString()
  injuryDetails?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ExtractedThirdPartyInfoDto)
  thirdPartyInfo?: ExtractedThirdPartyInfoDto;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;
}

/**
 * Response DTO for chat endpoint
 */
export class ChatResponseDto {
  /**
   * The AI's response message
   */
  message: string;

  /**
   * Whether the AI has gathered all required information
   */
  isComplete: boolean;

  /**
   * Partially or fully extracted claim data
   */
  extractedData?: Partial<ExtractedClaimDataDto>;

  /**
   * Suggested next actions for the user
   */
  suggestedActions?: string[];
}
