import { z } from 'zod';
import { VehicleType } from '../types/vehicle';

// License Plate Regex (German format, flexible)
const licensePlateRegex = /^[A-ZÄÖÜ]{1,3}[-\s]?[A-Z]{1,2}[-\s]?\d{1,4}[EH]?$/i;

// Create Vehicle Schema
export const createVehicleSchema = z.object({
  licensePlate: z
    .string()
    .min(1, 'Kennzeichen ist erforderlich')
    .max(20, 'Kennzeichen darf maximal 20 Zeichen haben')
    .transform((val) => val.toUpperCase().replace(/\s/g, '-')),
  brand: z.string().max(100, 'Marke darf maximal 100 Zeichen haben').optional(),
  model: z.string().max(100, 'Modell darf maximal 100 Zeichen haben').optional(),
  year: z
    .number()
    .int()
    .min(1900, 'Baujahr muss nach 1900 sein')
    .max(new Date().getFullYear() + 1, 'Baujahr kann nicht in der Zukunft liegen')
    .optional(),
  vin: z
    .string()
    .length(17, 'FIN muss genau 17 Zeichen haben')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'Ungültige FIN')
    .transform((val) => val.toUpperCase())
    .optional()
    .or(z.literal('')),
  hsn: z
    .string()
    .max(10, 'HSN darf maximal 10 Zeichen haben')
    .optional()
    .or(z.literal('')),
  tsn: z
    .string()
    .max(10, 'TSN darf maximal 10 Zeichen haben')
    .optional()
    .or(z.literal('')),
  internalName: z
    .string()
    .max(100, 'Interner Name darf maximal 100 Zeichen haben')
    .optional(),
  vehicleType: z.nativeEnum(VehicleType).default(VehicleType.CAR),
  color: z.string().max(50, 'Farbe darf maximal 50 Zeichen haben').optional(),
});

export type CreateVehicleSchema = z.infer<typeof createVehicleSchema>;

// Update Vehicle Schema
export const updateVehicleSchema = createVehicleSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateVehicleSchema = z.infer<typeof updateVehicleSchema>;

// Vehicle Filter Schema
export const vehicleFilterSchema = z.object({
  isActive: z.coerce.boolean().optional(),
  vehicleType: z.nativeEnum(VehicleType).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default('licensePlate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type VehicleFilterSchema = z.infer<typeof vehicleFilterSchema>;
