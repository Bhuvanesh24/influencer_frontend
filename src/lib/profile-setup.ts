import type { CreatorProfile } from '@/lib/api/creator';

/**
 * The creator profile's seven setup steps (prompt.md §6.2) — the same seven the wizard walks
 * through. The profile hub lists them with a done/not-done state and opens the wizard at any one
 * of them, and the completeness shown on Home is the share of steps that are done.
 */
export const SETUP_STEPS = [
  { step: 1, title: 'About you', subtitle: 'Title, bio, gender and date of birth' },
  { step: 2, title: 'Location', subtitle: 'State, district and city' },
  { step: 3, title: 'Languages & niches', subtitle: 'What you create, and in which languages' },
  { step: 4, title: 'Social accounts', subtitle: 'Instagram and YouTube, with audience size' },
  { step: 5, title: 'Photos', subtitle: 'Profile photo and cover photos' },
  { step: 6, title: 'Phone number', subtitle: 'Verified with a one-time code' },
  { step: 7, title: 'Packages', subtitle: 'What brands can book you for' },
] as const;

export type SetupStep = (typeof SETUP_STEPS)[number]['step'];

export function setupStepDone(step: SetupStep, profile: CreatorProfile, activePackageCount: number): boolean {
  switch (step) {
    case 1:
      return !!profile.creatorTitle && !!profile.bio;
    case 2:
      return !!profile.state && !!profile.city;
    case 3:
      return profile.languages.length > 0 && profile.niches.length > 0;
    case 4:
      return !!profile.instagramHandle || !!profile.youtubeChannelUrl;
    case 5:
      return !!profile.profilePhotoUrl;
    case 6:
      return profile.phoneVerified;
    case 7:
      return activePackageCount > 0;
  }
}

export function setupProgress(profile: CreatorProfile, activePackageCount: number) {
  const done = SETUP_STEPS.filter((s) => setupStepDone(s.step, profile, activePackageCount));
  const firstMissing = SETUP_STEPS.find((s) => !setupStepDone(s.step, profile, activePackageCount));
  return {
    doneCount: done.length,
    percent: Math.round((done.length / SETUP_STEPS.length) * 100),
    firstMissingStep: firstMissing?.step ?? null,
  };
}
