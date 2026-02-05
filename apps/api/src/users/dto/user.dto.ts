import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { UserRole } from '@poa/database';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Vorname darf maximal 100 Zeichen haben' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Nachname darf maximal 100 Zeichen haben' })
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Telefonnummer darf maximal 50 Zeichen haben' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Position darf maximal 100 Zeichen haben' })
  position?: string;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: 'Ungültige Rolle' })
  role: UserRole;
}
