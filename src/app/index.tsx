import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { refreshAccessToken } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { hasSeenWelcomeCarousel } from '@/lib/local-flags';

const MAX_SPLASH_MS = 1500;

/** Splash (prompt.md §6.1) — brand mark, silent refresh attempt, auto-advances, no interaction. */
export default function SplashScreen() {
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const { tokens } = useAuthStore.getState();
      const checks: Promise<unknown>[] = [new Promise((r) => setTimeout(r, MAX_SPLASH_MS))];

      if (tokens?.refreshToken) {
        checks.push(refreshAccessToken());
      }

      await Promise.race([
        Promise.all(checks),
        new Promise((r) => setTimeout(r, MAX_SPLASH_MS)),
      ]);

      if (cancelled || hasNavigated.current) return;
      hasNavigated.current = true;

      const isAuthenticated = useAuthStore.getState().tokens !== null;
      if (isAuthenticated) {
        // Onboarding / role tab groups ship in later sprints — see SPRINTS.md 1.2+.
        router.replace('/coming-soon');
        return;
      }

      const seenWelcome = await hasSeenWelcomeCarousel();
      router.replace(seenWelcome ? '/login' : '/welcome');
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-base">
      <Text variant="display" weight="bold" color="brand">
        InfluenceHub
      </Text>
    </View>
  );
}
