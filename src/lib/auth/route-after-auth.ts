import type { Href } from 'expo-router';

import { hasSeenHowItWorks } from '@/lib/local-flags';
import type { AuthUser } from '@/lib/auth/types';

/**
 * Single source of truth for "where does this authenticated user go" — mirrors the root gate
 * logic in prompt.md §4. Used by both the Splash screen (index.tsx, on silent-refresh success)
 * and Login (right after a fresh login/Google callback) so the branching never drifts between
 * the two call sites. Onboarding's own internal steps (role-selection → bank-setup →
 * how-it-works) navigate directly rather than through this — it's only for "where does someone
 * with this persisted state land."
 */
export async function getPostAuthRoute(user: AuthUser): Promise<Href> {
  if (user.accountType === null) {
    return '/(onboarding)/role-selection';
  }
  if (!user.hasBankAccount) {
    // Defensive guard only — bank account is set atomically with accountType via
    // complete-onboarding, so this path shouldn't normally be reachable.
    return '/(onboarding)/bank-setup';
  }
  if (!(await hasSeenHowItWorks())) {
    return '/(onboarding)/how-it-works';
  }
  // Role tab groups ship in Phase 2/3 — see SPRINTS.md.
  return '/coming-soon';
}
