import { IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatMessageDto } from './chat-message.dto';

/**
 * Request DTO for completing a chat and creating a claim
 */
export class ChatCompleteRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @IsOptional()
  @IsBoolean()
  submitImmediately?: boolean;
}

/**
 * Validation result for extracted claim data
 */
export interface ClaimDataValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}
