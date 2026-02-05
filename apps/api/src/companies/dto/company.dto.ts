import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Name darf maximal 200 Zeichen haben' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Adresse darf maximal 500 Zeichen haben' })
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Stadt darf maximal 100 Zeichen haben' })
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Postleitzahl darf maximal 20 Zeichen haben' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3, { message: 'Ländercode darf maximal 3 Zeichen haben' })
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Telefonnummer darf maximal 50 Zeichen haben' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Website darf maximal 200 Zeichen haben' })
  website?: string;
}
