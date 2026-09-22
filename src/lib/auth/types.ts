/**
 * PROVISIONAL types — prompt.md references these endpoints and fields inline but the full
 * shapes live in the companion `frontend_prompt.md` (backend API reference), which is not yet
 * available in this repo. Fields below are the ones prompt.md's screen specs actually depend on
 * (root gate logic §4, onboarding §6.2). Reconcile against the real API reference before
 * shipping — see SPRINTS.md "Deviations from Spec".
 */
export type AccountType = 'creator' | 'brand';

export interface AuthUser {
  id: string;
  email: string;
  accountType: AccountType | null;
  displayName: string | null;
  hasBankAccount: boolean;
  phoneVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}
