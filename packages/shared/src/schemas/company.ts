import { z } from 'zod';

// Update Company Schema
export const updateCompanySchema = z.object({
  name: z
    .string()
    .min(2, 'Firmenname muss mindestens 2 Zeichen haben')
    .max(255, 'Firmenname darf maximal 255 Zeichen haben')
    .optional(),
  address: z
    .string()
    .max(500, 'Adresse darf maximal 500 Zeichen haben')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .max(100, 'Stadt darf maximal 100 Zeichen haben')
    .optional()
    .or(z.literal('')),
  postalCode: z
    .string()
    .max(20, 'PLZ darf maximal 20 Zeichen haben')
    .optional()
    .or(z.literal('')),
  country: z
    .string()
    .max(2, 'Ländercode muss 2 Zeichen haben')
    .default('DE')
    .optional(),
  phone: z
    .string()
    .max(50, 'Telefonnummer darf maximal 50 Zeichen haben')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Ungültige URL')
    .max(255, 'Website darf maximal 255 Zeichen haben')
    .optional()
    .or(z.literal('')),
});

export type UpdateCompanySchema = z.infer<typeof updateCompanySchema>;
