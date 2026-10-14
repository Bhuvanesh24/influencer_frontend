import { create } from 'zustand';

import type { FollowerRange } from '@/components/ui/Badge';
import type { CreatorPackage, CreatorProfile } from '@/lib/api/creator';
import type { ContentType } from '@/lib/constants';

/** A package already created on the server during step 7 — kept so the step can list them. */
export interface WizardPackage {
  id: string;
  title: string;
  contentType: ContentType;
  quantity: number;
  price: number;
}

export interface CreatorWizardData {
  creatorTitle: string;
  bio: string;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
  dateOfBirth: Date | null;
  country: string;
  state: string;
  district: string;
  city: string;
  languages: string[];
  niches: string[];
  instagramHandle: string;
  instagramFollowerRange: FollowerRange | null;
  youtubeChannelUrl: string;
  youtubeSubscriberRange: FollowerRange | null;
  featuredReelUrl: string;
  profilePhotoUri: string | null;
  coverPhotoUris: string[];
  phone: string;
  phoneVerified: boolean;
  packages: WizardPackage[];
}

const initialData: CreatorWizardData = {
  creatorTitle: '',
  bio: '',
  gender: null,
  dateOfBirth: null,
  country: 'India',
  state: '',
  district: '',
  city: '',
  languages: [],
  niches: [],
  instagramHandle: '',
  instagramFollowerRange: null,
  youtubeChannelUrl: '',
  youtubeSubscriberRange: null,
  featuredReelUrl: '',
  profilePhotoUri: null,
  coverPhotoUris: [],
  phone: '',
  phoneVerified: false,
  packages: [],
};

interface CreatorWizardState {
  step: number;
  data: CreatorWizardData;
  setStep: (step: number) => void;
  update: (patch: Partial<CreatorWizardData>) => void;
  /** Fills every step from the saved profile, so the wizard opens pre-filled for editing. */
  hydrate: (profile: CreatorProfile, packages: CreatorPackage[]) => void;
  reset: () => void;
}

export function wizardDataFromProfile(profile: CreatorProfile, packages: CreatorPackage[]): CreatorWizardData {
  return {
    creatorTitle: profile.creatorTitle ?? '',
    bio: profile.bio ?? '',
    gender: profile.gender ?? null,
    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
    country: profile.country ?? 'India',
    state: profile.state ?? '',
    district: profile.district ?? '',
    city: profile.city ?? '',
    languages: profile.languages,
    niches: profile.niches,
    instagramHandle: profile.instagramHandle ?? '',
    instagramFollowerRange: profile.instagramFollowerRange,
    youtubeChannelUrl: profile.youtubeChannelUrl ?? '',
    youtubeSubscriberRange: profile.youtubeSubscriberRange,
    featuredReelUrl: profile.featuredReelUrl ?? '',
    profilePhotoUri: profile.profilePhotoUrl,
    coverPhotoUris: profile.coverPhotos,
    // The field holds the 10-digit number; the country code is added when sending.
    phone: (profile.phoneNumber ?? '').replace(/\D/g, '').slice(-10),
    phoneVerified: profile.phoneVerified,
    packages: packages
      .filter((p) => p.isActive)
      .map((p) => ({ id: p.id, title: p.title, contentType: p.contentType, quantity: p.quantity, price: Number(p.price) })),
  };
}

/**
 * In-memory wizard state (prompt.md §6.2's Creator Profile Setup Wizard, 7 steps). During
 * onboarding it accumulates what each step saves; when the wizard is opened from the profile
 * screen, `hydrate` first fills it from `GET /creators/me`, so every step shows the saved values.
 */
export const useCreatorWizardStore = create<CreatorWizardState>((set) => ({
  step: 1,
  data: initialData,
  setStep: (step) => set({ step }),
  update: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
  hydrate: (profile, packages) => set({ data: wizardDataFromProfile(profile, packages) }),
  reset: () => set({ step: 1, data: initialData }),
}));
