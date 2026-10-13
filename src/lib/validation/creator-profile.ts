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

const urlOrEmpty = z.union([z.string().trim().url('Enter a valid URL'), z.literal('')]);

/**
 * Edit Profile (prompt.md §6.4). Unlike the wizard's step schemas, nothing here is required:
 * the backend's `PUT /creators/me/profile` takes every field as optional, and a creator who
 * skipped the wizard must be able to save one field without filling in the rest. Only the format
 * and length rules are enforced, mirroring the backend's `updateCreatorProfileSchema`.
 */
export const creatorProfileEditSchema = z.object({
  creatorTitle: z.string().trim().max(60, 'Keep it under 60 characters'),
  bio: z.string().trim().max(300, 'Keep it under 300 characters'),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).nullable(),
  dateOfBirth: z
    .date()
    .nullable()
    .refine((d) => d === null || isAtLeast16(d), { message: 'You must be at least 16' }),
  state: z.string().trim(),
  district: z.string().trim().max(128, 'Keep it under 128 characters'),
  city: z.string().trim(),
  languages: z.array(z.string()),
  niches: z.array(z.string()).max(5, 'Max 5 niches'),
  instagramHandle: z.string().trim().max(128, 'Keep it under 128 characters'),
  instagramFollowerRange: z.enum(FOLLOWER_RANGE_VALUES).nullable(),
  youtubeChannelUrl: urlOrEmpty,
  youtubeSubscriberRange: z.enum(FOLLOWER_RANGE_VALUES).nullable(),
  featuredReelUrl: urlOrEmpty,
});
export type CreatorProfileEditInput = z.infer<typeof creatorProfileEditSchema>;
