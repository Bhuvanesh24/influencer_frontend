import { useRouter } from 'expo-router';
import { Construction } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/lib/auth/store';

/**
 * Temporary landing spot for any authenticated, fully-onboarded state that doesn't have a real
 * destination yet — the Creator/Brand tab groups ship in Phase 2/3 (see SPRINTS.md). Replace
 * each call site that routes here once its real screen exists; this file should not survive
 * past Phase 3.
 */
export default function ComingSoonScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const clear = useAuthStore((s) => s.clear);
  const accountType = useAuthStore((s) => s.user?.accountType);

  return (
    <Screen contentClassName="flex-1 items-center justify-center gap-4 px-6">
      <View className="rounded-full bg-brand/10 p-4">
        <Construction size={32} color={colors.brand.primary} />
      </View>
      <Text variant="h2" weight="bold" className="text-center">
        You&apos;re signed in
      </Text>
      <Text variant="body" color="secondary" className="text-center">
        The main app (dashboards, wizard, tabs) ships in the next build sprints.
      </Text>
      <View className="mt-4 w-full gap-3">
        {accountType === 'brand' && (
          // Temporary entry point — Brand Profile Setup's real home is Settings (Sprint 8.2),
          // which doesn't exist yet. Remove this button once it does.
          <Button variant="secondary" onPress={() => router.push('/brand-profile-setup')}>
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
      </View>
    </Screen>
  );
}
