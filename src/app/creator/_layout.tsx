import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/lib/auth/store';

/**
 * Creator area (prompt.md §4): the tab group plus the screens pushed on top of it. A real
 * `creator/` path segment (not a route group) so its URLs can never collide with the brand
 * area's — `/creator/home` vs a future `/brand/home`.
 */
export default function CreatorLayout() {
  const hasSession = useAuthStore((s) => s.tokens !== null);
  const accountType = useAuthStore((s) => s.user?.accountType);

  if (!hasSession) {
    return <Redirect href="/login" />;
  }
  if (accountType !== 'creator') {
    // Wrong role (or onboarding unfinished): let the splash router decide where they belong.
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
