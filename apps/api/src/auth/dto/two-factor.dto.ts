import { IsString, Length, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO for enabling 2FA - requires the TOTP token from authenticator app
 */
export class Enable2FADto {
  @IsString()
  @Length(6, 6, { message: 'Token must be exactly 6 digits' })
  @IsNotEmpty()
  token: string;
}

/**
 * DTO for validating 2FA during login
 */
export class Validate2FADto {
  @IsString()
  @Length(6, 6, { message: 'Token must be exactly 6 digits' })
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  tempToken: string; // Temporary token from initial login
}

/**
 * DTO for disabling 2FA - requires password confirmation
 */
export class Disable2FADto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * DTO for using a backup code
 */
export class UseBackupCodeDto {
  @IsString()
  @Length(8, 8, { message: 'Backup code must be exactly 8 characters' })
  @IsNotEmpty()
  backupCode: string;

  @IsString()
  @IsNotEmpty()
  tempToken: string; // Temporary token from initial login
}

/**
 * Response DTO for 2FA setup
 */
export class Setup2FAResponseDto {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

/**
 * Response DTO when login requires 2FA
 */
export class Requires2FAResponseDto {
  requires2FA: boolean;
  tempToken: string; // Temporary token to complete 2FA validation
  userId: string;
}
