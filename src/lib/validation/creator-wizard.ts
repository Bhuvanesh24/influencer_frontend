import { z } from 'zod';

const FOLLOWER_RANGE_VALUES = [
  'under_1k',
  'range_1k_10k',
  'range_10k_50k',
  'range_50k_100k',
  'range_100k_500k',
  'range_500k_1m',
  'range_1m_plus',
] as const;

function isAtLeast16(date: Date): boolean {
  const sixteenYearsAgo = new Date();
  sixteenYearsAgo.setFullYear(sixteenYearsAgo.getFullYear() - 16);
  return date <= sixteenYearsAgo;
}

export const identityStepSchema = z.object({
  creatorTitle: z.string().trim().min(2, 'At least 2 characters').max(60, 'Keep it under 60 characters'),
  bio: z.string().trim().max(300, 'Keep it under 300 characters'),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say'], {
    message: 'Select an option',
  }),
  dateOfBirth: z.date({ message: 'Enter your date of birth' }).refine(isAtLeast16, {
    message: 'You must be at least 16',
  }),
});
export type IdentityStepInput = z.infer<typeof identityStepSchema>;

export const locationStepSchema = z.object({
  country: z.string().trim().min(1),
  state: z.string().trim().min(1, 'Select a state'),
  district: z.string().trim().optional(),
  city: z.string().trim().min(1, 'Enter your city'),
});
export type LocationStepInput = z.infer<typeof locationStepSchema>;

export const languagesNichesStepSchema = z.object({
  languages: z.array(z.string()).min(1, 'Select at least 1 language'),
  niches: z.array(z.string()).min(1, 'Select at least 1 niche').max(5, 'Max 5 niches'),
});
export type LanguagesNichesStepInput = z.infer<typeof languagesNichesStepSchema>;

const urlOrEmpty = z.union([z.string().trim().url('Enter a valid URL'), z.literal('')]);

export const socialAccountsStepSchema = z.object({
  instagramHandle: z.string().trim().min(1, 'Enter your Instagram handle'),
  instagramFollowerRange: z.enum(FOLLOWER_RANGE_VALUES, { message: 'Select a range' }),
  youtubeChannelUrl: urlOrEmpty,
  youtubeSubscriberRange: z.enum(FOLLOWER_RANGE_VALUES).optional(),
  featuredReelUrl: urlOrEmpty,
});
export type SocialAccountsStepInput = z.infer<typeof socialAccountsStepSchema>;

export const phoneStepSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});
export type PhoneStepInput = z.infer<typeof phoneStepSchema>;

export const firstPackageStepSchema = z.object({
  title: z.string().trim().min(2, 'Enter a title'),
  contentType: z.string().min(1, 'Select a content type'),
  quantity: z.number().int().min(1, 'At least 1'),
  price: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Enter a price')
    .refine((v) => Number(v) > 0, 'Enter a price'),
  description: z.string().trim().max(1000).optional(),
});
export type FirstPackageStepInput = z.infer<typeof firstPackageStepSchema>;
