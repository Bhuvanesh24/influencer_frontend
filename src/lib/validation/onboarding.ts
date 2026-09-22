import { z } from 'zod';

export const roleSelectionSchema = z.object({
  accountType: z.enum(['creator', 'brand']),
  displayName: z
    .string()
    .trim()
    .min(2, 'At least 2 characters')
    .max(60, 'Keep it under 60 characters'),
});
export type RoleSelectionInput = z.infer<typeof roleSelectionSchema>;

/** Mirrors the backend's IFSC format rule (prompt.md §6.2). */
export const ifscSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid 11-character IFSC code');

const upiIdSchema = z
  .string()
  .trim()
  .regex(/^[\w.-]{2,256}@[a-zA-Z]{2,64}$/, 'Enter a valid UPI ID (e.g. name@bank)');

export const bankSetupSchema = z
  .object({
    accountHolderName: z.string().trim().min(2, 'Enter the account holder’s name'),
    accountNumber: z
      .string()
      .trim()
      .regex(/^\d{9,18}$/, 'Enter a valid account number'),
    confirmAccountNumber: z.string().trim().min(1, 'Please confirm the account number'),
    ifscCode: ifscSchema,
    bankName: z.string().trim().min(2, 'Enter the bank name'),
    addUpi: z.boolean(),
    upiId: z.union([upiIdSchema, z.literal('')]),
  })
  .refine((v) => v.accountNumber === v.confirmAccountNumber, {
    message: 'Account numbers do not match',
    path: ['confirmAccountNumber'],
  })
  .refine((v) => !v.addUpi || v.upiId.length > 0, {
    message: 'Enter a UPI ID or remove this section',
    path: ['upiId'],
  });
export type BankSetupInput = z.infer<typeof bankSetupSchema>;
