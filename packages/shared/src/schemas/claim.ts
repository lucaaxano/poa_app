import { z } from 'zod';
import { ClaimStatus, DamageCategory } from '../types/claim';

// Third Party Info Schema
const thirdPartyInfoSchema = z.object({
  licensePlate: z.string().optional(),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  insurerName: z.string().optional(),
  policyNumber: z.string().optional(),
});

// Witness Info Schema
const witnessInfoSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

// Create Claim Schema
export const createClaimSchema = z.object({
  vehicleId: z.string().uuid('Ungültige Fahrzeug-ID'),
  policyId: z.string().uuid('Ungültige Policy-ID').optional(),
  driverUserId: z.string().uuid('Ungültige Fahrer-ID').optional(),
  accidentDate: z.coerce.date({
    errorMap: () => ({ message: 'Ungültiges Datum' }),
  }),
  accidentTime: z.string().optional(),
  accidentLocation: z
    .string()
    .max(500, 'Unfallort darf maximal 500 Zeichen haben')
    .optional(),
  gpsLat: z.number().min(-90).max(90).optional(),
  gpsLng: z.number().min(-180).max(180).optional(),
  damageCategory: z.nativeEnum(DamageCategory, {
    errorMap: () => ({ message: 'Ungültige Schadenkategorie' }),
  }),
  damageSubcategory: z.string().max(100).optional(),
  description: z
    .string()
    .max(5000, 'Beschreibung darf maximal 5000 Zeichen haben')
    .optional(),
  policeInvolved: z.boolean().default(false),
  policeFileNumber: z.string().max(100).optional(),
  hasInjuries: z.boolean().default(false),
  injuryDetails: z.string().max(2000).optional(),
  thirdPartyInfo: thirdPartyInfoSchema.optional(),
  witnessInfo: z.array(witnessInfoSchema).optional(),
  estimatedCost: z.number().positive().optional(),
});

export type CreateClaimSchema = z.infer<typeof createClaimSchema>;

// Update Claim Schema
export const updateClaimSchema = createClaimSchema.partial().extend({
  finalCost: z.number().positive().optional(),
  insurerClaimNumber: z.string().max(100).optional(),
});

export type UpdateClaimSchema = z.infer<typeof updateClaimSchema>;

// Submit Claim Schema (for status change)
export const submitClaimSchema = z.object({
  claimId: z.string().uuid('Ungültige Schaden-ID'),
});

export type SubmitClaimSchema = z.infer<typeof submitClaimSchema>;

// Approve Claim Schema
export const approveClaimSchema = z.object({
  claimId: z.string().uuid('Ungültige Schaden-ID'),
});

export type ApproveClaimSchema = z.infer<typeof approveClaimSchema>;

// Reject Claim Schema
export const rejectClaimSchema = z.object({
  claimId: z.string().uuid('Ungültige Schaden-ID'),
  rejectionReason: z
    .string()
    .min(10, 'Ablehnungsgrund muss mindestens 10 Zeichen haben')
    .max(1000, 'Ablehnungsgrund darf maximal 1000 Zeichen haben'),
});

export type RejectClaimSchema = z.infer<typeof rejectClaimSchema>;

// Send Claim Schema
export const sendClaimSchema = z.object({
  claimId: z.string().uuid('Ungültige Schaden-ID'),
  policyId: z.string().uuid('Policy ist erforderlich für den Versand'),
});

export type SendClaimSchema = z.infer<typeof sendClaimSchema>;

// Claim Filter Schema
export const claimFilterSchema = z.object({
  status: z.array(z.nativeEnum(ClaimStatus)).optional(),
  vehicleId: z.string().uuid().optional(),
  driverUserId: z.string().uuid().optional(),
  damageCategory: z.array(z.nativeEnum(DamageCategory)).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ClaimFilterSchema = z.infer<typeof claimFilterSchema>;

// Claim Comment Schema
export const createClaimCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Kommentar darf nicht leer sein')
    .max(2000, 'Kommentar darf maximal 2000 Zeichen haben'),
});

export type CreateClaimCommentSchema = z.infer<typeof createClaimCommentSchema>;
