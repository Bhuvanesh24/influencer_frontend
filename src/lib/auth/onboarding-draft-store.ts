import { create } from 'zustand';

import type { AccountType } from '@/lib/auth/types';

interface OnboardingDraftState {
  accountType: AccountType | null;
  displayName: string;
  setRoleStep: (input: { accountType: AccountType; displayName: string }) => void;
  clear: () => void;
}

/**
 * In-memory-only handoff between Role Selection and Bank & Payout Setup (prompt.md §6.2) — the
 * actual `complete-onboarding` API call happens once, at the end of Bank Setup, bundling
 * accountType + displayName (collected here) with the bank details. Not persisted: if the app is
 * killed mid-onboarding, the user just re-picks their role, which is cheap and avoids stale
 * partial state surviving a restart.
 */
export const useOnboardingDraftStore = create<OnboardingDraftState>((set) => ({
  accountType: null,
  displayName: '',
  setRoleStep: ({ accountType, displayName }) => set({ accountType, displayName }),
  clear: () => set({ accountType: null, displayName: '' }),
}));
