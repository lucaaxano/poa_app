import { z } from 'zod';
import { UserRole } from '../types/user';

// Update Profile Schema
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Vorname muss mindestens 2 Zeichen haben')
    .max(100, 'Vorname darf maximal 100 Zeichen haben')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Nachname muss mindestens 2 Zeichen haben')
    .max(100, 'Nachname darf maximal 100 Zeichen haben')
    .optional(),
  phone: z
    .string()
    .max(50, 'Telefonnummer darf maximal 50 Zeichen haben')
    .optional()
    .or(z.literal('')),
  position: z
    .string()
    .max(100, 'Position darf maximal 100 Zeichen haben')
    .optional()
    .or(z.literal('')),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

// Update User Role Schema (Admin only)
export const updateUserRoleSchema = z.object({
  userId: z.string().uuid('Ungueltige Benutzer-ID'),
  role: z.enum([UserRole.EMPLOYEE, UserRole.COMPANY_ADMIN], {
    errorMap: () => ({ message: 'Ungueltige Rolle' }),
  }),
});

export type UpdateUserRoleSchema = z.infer<typeof updateUserRoleSchema>;

// User Filter Schema
export const userFilterSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type UserFilterSchema = z.infer<typeof userFilterSchema>;
