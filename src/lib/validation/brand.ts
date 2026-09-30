import { z } from 'zod';

const urlOrEmpty = z.union([z.string().trim().url('Enter a valid URL'), z.literal('')]);

export const brandProfileSchema = z.object({
  companyName: z.string().trim().min(2, 'Enter a company name'),
  website: urlOrEmpty,
  industry: z.string().min(1, 'Select an industry'),
  description: z.string().trim().max(150, 'Keep it under 150 characters'),
  country: z.string().trim().min(1),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  gstin: z.union([z.string().trim().regex(/^[0-9A-Z]{15}$/, 'Enter a valid 15-character GSTIN'), z.literal('')]),
  showBrandNameInCollabs: z.boolean(),
});
export type BrandProfileInput = z.infer<typeof brandProfileSchema>;
