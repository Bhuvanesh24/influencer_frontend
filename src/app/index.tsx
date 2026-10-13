import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { resolveInitialRoute } from '@/lib/auth/initial-route';

/**
 * Splash (prompt.md §6.1) — brand mark, silent refresh attempt, auto-advances, no interaction.
 * Deliberately static and laid out exactly like the native splash (same background, same 140pt
 * mark, centered), so the hand-off from native splash to this screen is invisible. Where it
 * goes next is decided entirely by `resolveInitialRoute`.
 */
export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    resolveInitialRoute().then((route) => {
      if (!cancelled) router.replace(route);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-base">
      <Image
        source={require('../../assets/images/splash-icon.png')}
        style={{ width: 140, height: 140 }}
        accessibilityLabel="FindCollab"
      />
    </View>
  );
}
