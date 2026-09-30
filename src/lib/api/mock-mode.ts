import type { AuthUser } from '@/lib/auth/types';

/**
 * DEV-ONLY MOCK LAYER — exists purely so the app is click-through-testable before a real backend
 * exists (`frontend_prompt.md` isn't in this repo yet — see CLAUDE.md). Every API function this
 * touches branches on `IS_MOCK_API` at its top; the real network call is what runs once a
 * backend is available. Delete this whole file (and the mock branches referencing it) once one
 * exists — do not let it linger as "temporary" scaffolding past that point.
 *
 * Default ON (no backend to point at yet). Set `EXPO_PUBLIC_MOCK_API=false` to use the real
 * `apiClient` against `EXPO_PUBLIC_API_BASE_URL` instead.
 */
export const IS_MOCK_API = process.env.EXPO_PUBLIC_MOCK_API !== 'false';

/** Simulates network latency so loading states/spinners are actually visible while testing. */
export function mockDelay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const MOCK_OTP_CODE = '888999';

/**
 * Single in-memory fake "logged in user" — mutated by the mock branches of completeOnboarding /
 * verifyPhoneOtp so that, within one running app session, later screens (route gating, the
 * profile-completeness banner once it exists) see consistent progress. Resets on JS reload /
 * app restart, same as any other in-memory mock — that's expected, not a bug.
 */
export const mockUser: AuthUser = {
  id: 'mock-user-1',
  email: 'demo@example.com',
  accountType: null,
  displayName: null,
  hasBankAccount: false,
  phoneVerified: false,
};
