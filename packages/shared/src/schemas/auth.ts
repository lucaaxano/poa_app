import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

export type LoginSchema = z.infer<typeof loginSchema>;

// Register Schema
export const registerSchema = z.object({
  companyName: z
    .string()
    .min(2, 'Firmenname muss mindestens 2 Zeichen haben')
    .max(255, 'Firmenname darf maximal 255 Zeichen haben'),
  firstName: z
    .string()
    .min(2, 'Vorname muss mindestens 2 Zeichen haben')
    .max(100, 'Vorname darf maximal 100 Zeichen haben'),
  lastName: z
    .string()
    .min(2, 'Nachname muss mindestens 2 Zeichen haben')
    .max(100, 'Nachname darf maximal 100 Zeichen haben'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
    ),
  numVehicles: z.number().int().positive().optional(),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

// Password Reset Request Schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

// Password Reset Schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token ist erforderlich'),
    password: z
      .string()
      .min(8, 'Passwort muss mindestens 8 Zeichen haben')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

// Change Password Schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
    newPassword: z
      .string()
      .min(8, 'Passwort muss mindestens 8 Zeichen haben')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

// Invite User Schema
export const inviteUserSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  role: z.enum(['EMPLOYEE', 'BROKER'], {
    errorMap: () => ({ message: 'Ungültige Rolle' }),
  }),
});

export type InviteUserSchema = z.infer<typeof inviteUserSchema>;

// Accept Invitation Schema
export const acceptInvitationSchema = z
  .object({
    token: z.string().min(1, 'Token ist erforderlich'),
    firstName: z
      .string()
      .min(2, 'Vorname muss mindestens 2 Zeichen haben')
      .max(100, 'Vorname darf maximal 100 Zeichen haben'),
    lastName: z
      .string()
      .min(2, 'Nachname muss mindestens 2 Zeichen haben')
      .max(100, 'Nachname darf maximal 100 Zeichen haben'),
    password: z
      .string()
      .min(8, 'Passwort muss mindestens 8 Zeichen haben')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
  });

export type AcceptInvitationSchema = z.infer<typeof acceptInvitationSchema>;
