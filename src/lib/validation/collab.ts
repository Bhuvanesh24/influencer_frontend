import { z } from 'zod';

/** Mirrors the backend's `createDealSchema` (influencer_backend/src/validations/collab.validation.ts). */
export const sendRequestSchema = z.object({
  brief: z.string().trim().min(10, 'At least 10 characters').max(5000, 'At most 5000 characters'),
  offeredAmount: z
    .string()
    .min(1, 'Enter an amount')
    .refine((v) => Number(v) > 0, 'Enter an amount above zero'),
  postingDeadline: z.date().refine((d) => d.getTime() > Date.now(), 'Pick a date in the future'),
  referenceMaterials: z.array(z.string().url()),
  brandNotes: z.string().max(2000, 'At most 2000 characters'),
  requiresDraftApproval: z.boolean(),
});

export type SendRequestInput = z.infer<typeof sendRequestSchema>;
