import { IsEmail, IsString, MinLength, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { UserRole } from '@poa/database';

export class LoginDto {
  @IsEmail({}, { message: 'Ungueltige E-Mail-Adresse' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Passwort ist erforderlich' })
  password: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Firmenname muss mindestens 2 Zeichen haben' })
  companyName: string;

  @IsString()
  @MinLength(2, { message: 'Vorname muss mindestens 2 Zeichen haben' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Nachname muss mindestens 2 Zeichen haben' })
  lastName: string;

  @IsEmail({}, { message: 'Ungueltige E-Mail-Adresse' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen haben' })
  password: string;

  @IsOptional()
  @IsNumber()
  numVehicles?: number;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(1, { message: 'Refresh Token ist erforderlich' })
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Ungueltige E-Mail-Adresse' })
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(1, { message: 'Token ist erforderlich' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen haben' })
  password: string;
}

export class AcceptInvitationDto {
  @IsString()
  @MinLength(1, { message: 'Token ist erforderlich' })
  token: string;

  @IsString()
  @MinLength(2, { message: 'Vorname muss mindestens 2 Zeichen haben' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Nachname muss mindestens 2 Zeichen haben' })
  lastName: string;

  @IsString()
  @MinLength(8, { message: 'Passwort muss mindestens 8 Zeichen haben' })
  password: string;
}

export class InviteUserDto {
  @IsEmail({}, { message: 'Ungueltige E-Mail-Adresse' })
  email: string;

  @IsEnum(['EMPLOYEE', 'COMPANY_ADMIN', 'BROKER'], { message: 'Ungueltige Rolle' })
  role: 'EMPLOYEE' | 'COMPANY_ADMIN' | 'BROKER';
}
