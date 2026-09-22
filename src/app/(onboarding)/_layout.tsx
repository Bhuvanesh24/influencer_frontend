import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/lib/auth/store';

export default function OnboardingLayout() {
  const hasSession = useAuthStore((s) => s.tokens !== null);

  if (!hasSession) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
