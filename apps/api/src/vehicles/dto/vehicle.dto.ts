import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  MaxLength,
  Min,
  Max,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { VehicleType } from '@poa/database';

export class CreateVehicleDto {
  @IsString()
  @MaxLength(20, { message: 'Kennzeichen darf maximal 20 Zeichen haben' })
  @Transform(({ value }) => value?.toUpperCase().replace(/\s/g, '-'))
  licensePlate: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Marke darf maximal 100 Zeichen haben' })
  @Transform(({ value }) => value === '' ? undefined : value)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Modell darf maximal 100 Zeichen haben' })
  @Transform(({ value }) => value === '' ? undefined : value)
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900, { message: 'Baujahr muss nach 1900 sein' })
  @Max(new Date().getFullYear() + 1, { message: 'Baujahr kann nicht in der Zukunft liegen' })
  @Transform(({ value }) => value === '' || value === null ? undefined : value)
  year?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value || value === '') return undefined;
    return value.toUpperCase();
  })
  @Length(17, 17, { message: 'FIN muss genau 17 Zeichen haben' })
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i, { message: 'Ungültige FIN' })
  vin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'HSN darf maximal 10 Zeichen haben' })
  hsn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'TSN darf maximal 10 Zeichen haben' })
  tsn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Interner Name darf maximal 100 Zeichen haben' })
  internalName?: string;

  @IsOptional()
  @IsEnum(VehicleType, { message: 'Ungültiger Fahrzeugtyp' })
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Farbe darf maximal 50 Zeichen haben' })
  color?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Kennzeichen darf maximal 20 Zeichen haben' })
  @Transform(({ value }) => value?.toUpperCase().replace(/\s/g, '-'))
  licensePlate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Marke darf maximal 100 Zeichen haben' })
  @Transform(({ value }) => value === '' ? undefined : value)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Modell darf maximal 100 Zeichen haben' })
  @Transform(({ value }) => value === '' ? undefined : value)
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900, { message: 'Baujahr muss nach 1900 sein' })
  @Max(new Date().getFullYear() + 1, { message: 'Baujahr kann nicht in der Zukunft liegen' })
  @Transform(({ value }) => value === '' || value === null ? undefined : value)
  year?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (!value || value === '') return undefined;
    return value.toUpperCase();
  })
  @Length(17, 17, { message: 'FIN muss genau 17 Zeichen haben' })
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i, { message: 'Ungültige FIN' })
  vin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'HSN darf maximal 10 Zeichen haben' })
  hsn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'TSN darf maximal 10 Zeichen haben' })
  tsn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Interner Name darf maximal 100 Zeichen haben' })
  internalName?: string;

  @IsOptional()
  @IsEnum(VehicleType, { message: 'Ungültiger Fahrzeugtyp' })
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Farbe darf maximal 50 Zeichen haben' })
  color?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
