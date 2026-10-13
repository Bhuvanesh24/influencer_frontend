import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/lib/auth/store';

/**
 * Brand area (prompt.md §4): the tab group plus the screens pushed on top of it. Mirrors
 * `creator/_layout.tsx` — a real `brand/` path segment, guarded by session and role.
 */
export default function BrandLayout() {
  const hasSession = useAuthStore((s) => s.tokens !== null);
  const accountType = useAuthStore((s) => s.user?.accountType);

  if (!hasSession) {
    return <Redirect href="/login" />;
  }
  if (accountType !== 'brand') {
    // Wrong role (or onboarding unfinished): let the splash router decide where they belong.
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
