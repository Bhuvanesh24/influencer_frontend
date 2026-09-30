import { create } from 'zustand';

import type { FollowerRange } from '@/components/ui/Badge';

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
};

interface CreatorWizardState {
  step: number;
  data: CreatorWizardData;
  setStep: (step: number) => void;
  update: (patch: Partial<CreatorWizardData>) => void;
  reset: () => void;
}

/**
 * In-memory wizard state (prompt.md §6.2's Creator Profile Setup Wizard, 7 steps). Not persisted
 * to disk: real "resume where you left off across app restarts" needs `GET /creators/me` field
 * presence to check against (per the profile-completeness banner note in the same spec section),
 * which needs a real backend — see SPRINTS.md 1.3 Deviations. Within one running session, leaving
 * and returning to the wizard (e.g. via Back) keeps everything typed so far.
 */
export const useCreatorWizardStore = create<CreatorWizardState>((set) => ({
  step: 1,
  data: initialData,
  setStep: (step) => set({ step }),
  update: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
  reset: () => set({ step: 1, data: initialData }),
}));
