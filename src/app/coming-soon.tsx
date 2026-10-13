import { useRouter } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/lib/auth/store';
import { resetWelcomeCarousel } from '@/lib/local-flags';

/**
 * Temporary landing spot for any authenticated, fully-onboarded state that doesn't have a real
 * destination yet — the Creator/Brand tab groups ship in Phase 2/3 (see SPRINTS.md). Replace
 * each call site that routes here once its real screen exists; this file should not survive
 * past Phase 3.
 */
export default function ComingSoonScreen() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const accountType = useAuthStore((s) => s.user?.accountType);

  return (
    <Screen contentClassName="justify-center gap-8 px-6">
      <IconBadge icon={CircleCheck} />
      <View className="gap-2">
        <Text variant="h1">You&apos;re signed in</Text>
        <Text variant="body" color="secondary">
          Your account is set up. Your dashboard is on its way in the next release.
        </Text>
      </View>
      <View className="gap-2">
        {accountType === 'brand' && (
          // Temporary entry point — Brand Profile Setup's real home is Settings (Sprint 8.2),
          // which doesn't exist yet. Remove this button once it does.
          <Button variant="secondary" size="lg" onPress={() => router.push('/brand-profile-setup')}>
            Set Up Company Profile
          </Button>
        )}
        <Button
          variant="ghost"
          onPress={() => {
            clear();
            router.replace('/login');
          }}
        >
          Log Out
        </Button>
        {__DEV__ && (
          // Development builds only: signs out and replays the first-launch intro, so the
          // slides can be checked without clearing app data.
          <Button
            variant="ghost"
            onPress={async () => {
              await resetWelcomeCarousel();
              clear();
              router.replace('/welcome');
            }}
          >
            Replay intro (dev only)
          </Button>
        )}
      </View>
    </Screen>
  );
}
