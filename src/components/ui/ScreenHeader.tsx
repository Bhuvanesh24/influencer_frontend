import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ScreenHeaderProps {
  /** Optional centered title — most onboarding screens carry their title in the body instead. */
  title?: string;
  /** Overrides the default `router.back()` — e.g. a wizard stepping back one step. */
  onBack?: () => void;
  /** Hide the back control on a screen that is the root of its stack. */
  showBack?: boolean;
  /** Trailing slot (a Skip link, a step counter). */
  right?: ReactNode;
}

/**
 * Top row for any pushed screen: a visible 44pt back control, so leaving never depends on
 * knowing the iOS edge-swipe. The row keeps its height whether or not the back button renders,
 * so content below doesn't shift between a first step and a later one.
 */
export function ScreenHeader({ title, onBack, showBack = true, right }: ScreenHeaderProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const canGoBack = onBack !== undefined || router.canGoBack();

  return (
    <View className="min-h-11 flex-row items-center">
      <View className="w-11">
        {showBack && canGoBack && (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="-ml-2 h-11 w-11 items-center justify-center rounded-full active:bg-border"
          >
            <ChevronLeft size={24} color={colors.text.primary} />
          </Pressable>
        )}
      </View>
      <View className="flex-1 items-center">
        {title && (
          <Text variant="h3" numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      <View className="min-w-11 items-end">{right}</View>
    </View>
  );
}
