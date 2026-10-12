import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { refreshAccessToken } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { getPostAuthRoute } from '@/lib/auth/route-after-auth';
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

      const { tokens: currentTokens, user } = useAuthStore.getState();
      if (currentTokens && user) {
        router.replace(await getPostAuthRoute(user));
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
    <View className="flex-1 items-center justify-center gap-5 bg-base">
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14, mass: 0.6 }}
      >
        <Image source={require('../../assets/images/splash-icon.png')} style={{ width: 96, height: 96, borderRadius: 24 }} />
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 320, delay: 150 }}
      >
        <Text variant="h1" weight="bold">
          FindCollab
        </Text>
      </MotiView>
    </View>
  );
}
