import { z } from 'zod';

/** Mirrors the backend's password rule (prompt.md §6.1): min 8 chars, at least 1 digit. */
export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/\d/, 'At least 1 number');

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Live checklist rules shown under the password field while focused (prompt.md §6.1). */
export const passwordChecklist = [
  { key: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { key: 'digit', label: 'At least 1 number', test: (v: string) => /\d/.test(v) },
] as const;
