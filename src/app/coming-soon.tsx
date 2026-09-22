import { useRouter } from 'expo-router';
import { Construction } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/lib/auth/store';

/**
 * Temporary landing spot for any authenticated state that doesn't have a real destination yet
 * (Role Selection ships in Sprint 1.2, role tab groups in Phase 2/3 — see SPRINTS.md). Replace
 * each call site that routes here once its real screen exists; this file should not survive
 * past Phase 3.
 */
export default function ComingSoonScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const clear = useAuthStore((s) => s.clear);

  return (
    <Screen contentClassName="flex-1 items-center justify-center gap-4 px-6">
      <View className="rounded-full bg-brand/10 p-4">
        <Construction size={32} color={colors.brand.primary} />
      </View>
      <Text variant="h2" weight="bold" className="text-center">
        You&apos;re signed in
      </Text>
      <Text variant="body" color="secondary" className="text-center">
        Onboarding and the main app ship in the next build sprints.
      </Text>
      <Button
        variant="secondary"
        onPress={() => {
          clear();
          router.replace('/login');
        }}
        className="mt-4"
      >
        Log Out
      </Button>
    </Screen>
  );
}
