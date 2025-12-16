import { z } from 'zod';
import { CoverageType, PricingModel } from '../types/policy';

// Create Policy Schema
export const createPolicySchema = z.object({
  insurerId: z.string().uuid('Ungueltige Versicherer-ID'),
  policyNumber: z
    .string()
    .min(1, 'Vertragsnummer ist erforderlich')
    .max(100, 'Vertragsnummer darf maximal 100 Zeichen haben'),
  coverageType: z.nativeEnum(CoverageType, {
    errorMap: () => ({ message: 'Ungueltige Deckungsart' }),
  }),
  pricingModel: z.nativeEnum(PricingModel).optional(),
  annualPremium: z.number().positive('Jahresbeitrag muss positiv sein').optional(),
  deductible: z.number().min(0, 'Selbstbeteiligung kann nicht negativ sein').optional(),
  quotaThreshold: z
    .number()
    .min(0, 'Schwellenwert muss zwischen 0 und 1 liegen')
    .max(1, 'Schwellenwert muss zwischen 0 und 1 liegen')
    .optional(),
  validFrom: z.coerce.date({
    errorMap: () => ({ message: 'Ungueltiges Startdatum' }),
  }),
  validTo: z.coerce.date().optional(),
  notes: z.string().max(2000, 'Notizen duerfen maximal 2000 Zeichen haben').optional(),
});

export type CreatePolicySchema = z.infer<typeof createPolicySchema>;

// Update Policy Schema
export const updatePolicySchema = createPolicySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdatePolicySchema = z.infer<typeof updatePolicySchema>;

// Policy Filter Schema
export const policyFilterSchema = z.object({
  isActive: z.coerce.boolean().optional(),
  insurerId: z.string().uuid().optional(),
  coverageType: z.nativeEnum(CoverageType).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default('validFrom'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PolicyFilterSchema = z.infer<typeof policyFilterSchema>;
