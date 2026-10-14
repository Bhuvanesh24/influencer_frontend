import type { Href } from 'expo-router';

import { refreshAccessToken } from '@/lib/api/client';
import { initMockDb, restoreMockSession } from '@/lib/api/mock/session';
import { IS_MOCK_API } from '@/lib/api/mock-mode';
import { getPostAuthRoute } from '@/lib/auth/route-after-auth';
import { useAuthStore } from '@/lib/auth/store';
import { hasSeenWelcomeCarousel } from '@/lib/local-flags';

/** Longest a cold start will wait on a silent token refresh before moving on regardless. */
export const REFRESH_TIMEOUT_MS = 1500;

/**
 * Where a cold start lands (prompt.md §4) — the splash screen's only decision:
 *   session on device        → wherever `getPostAuthRoute` says that account belongs
 *   no session, intro unseen → /welcome (the three intro slides)
 *   no session, intro seen   → /login
 * Any failure falls back to /login rather than leaving the user on the splash.
 */
export async function resolveInitialRoute(): Promise<Href> {
  try {
    // Mock mode: load the saved demo database (or seed a fresh one) before anything reads it.
    if (IS_MOCK_API) await initMockDb();

    if (useAuthStore.getState().tokens?.refreshToken) {
      // Only a stored session has anything to wait for — a first launch moves on immediately.
      await Promise.race([
        refreshAccessToken(),
        new Promise((resolve) => setTimeout(resolve, REFRESH_TIMEOUT_MS)),
      ]);
    }

    const { tokens, user } = useAuthStore.getState();
    if (tokens && user) {
      // Mock mode: point the mock server back at the stored account.
      if (IS_MOCK_API) restoreMockSession(user);
      return await getPostAuthRoute(user);
    }

    return (await hasSeenWelcomeCarousel()) ? '/login' : '/welcome';
  } catch {
    return '/login';
  }
}
