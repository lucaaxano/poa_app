import { IsBoolean, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export type DigestMode = 'instant' | 'daily' | 'none';

export class EmailNotificationSettings {
  @IsBoolean()
  @IsOptional()
  newClaim?: boolean;

  @IsBoolean()
  @IsOptional()
  claimApproved?: boolean;

  @IsBoolean()
  @IsOptional()
  claimRejected?: boolean;

  @IsBoolean()
  @IsOptional()
  newComment?: boolean;

  @IsBoolean()
  @IsOptional()
  invitation?: boolean;
}

export class NotificationSettingsDto {
  @ValidateNested()
  @Type(() => EmailNotificationSettings)
  @IsOptional()
  email?: EmailNotificationSettings;

  @IsEnum(['instant', 'daily', 'none'])
  @IsOptional()
  digestMode?: DigestMode;
}

export interface NotificationSettingsResponseDto {
  email: {
    newClaim: boolean;
    claimApproved: boolean;
    claimRejected: boolean;
    newComment: boolean;
    invitation: boolean;
  };
  digestMode: DigestMode;
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsResponseDto = {
  email: {
    newClaim: true,
    claimApproved: true,
    claimRejected: true,
    newComment: true,
    invitation: true,
  },
  digestMode: 'instant',
};
