import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/lib/auth/store';
import { resetWelcomeCarousel } from '@/lib/local-flags';

/** Building blocks shared by the Creator and Brand Home screens, so the two read as one product. */

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View className="min-h-11 flex-row items-center justify-between px-6">
      <Text variant="h2">{title}</Text>
      {action}
    </View>
  );
}

export function StatTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="min-w-[45%] flex-1 gap-1 rounded-md border border-border bg-surface p-4">
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

/** A quiet in-section note for "nothing here yet" — a full-screen EmptyState would shout. */
export function SectionNote({ children }: { children: string }) {
  return (
    <View className="mx-6 rounded-md border border-border bg-surface p-4">
      <Text variant="bodySm" color="secondary">
        {children}
      </Text>
    </View>
  );
}

/** A full-width row that navigates somewhere: title, one line of explanation, chevron. */
export function NavRow({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      className="min-h-13 flex-row items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 active:bg-base"
    >
      <View className="flex-1 gap-0.5">
        <Text variant="body" weight="semibold">
          {title}
        </Text>
        <Text variant="bodySm" color="secondary">
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.text.muted} />
    </Pressable>
  );
}

export function DashboardSkeleton() {
  return (
    <View className="gap-6 px-6 pt-4">
      <View className="flex-row flex-wrap gap-3">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-20 min-w-[45%] flex-1" radius={12} />
        ))}
      </View>
      <SkeletonBlock className="h-14 w-full" radius={12} />
      <SkeletonBlock className="h-32 w-full" radius={12} />
    </View>
  );
}

/**
 * Temporary home for Log Out until Settings exists (SPRINTS.md 8.2). In development builds it
 * also offers "Replay intro", which signs out and shows the first-launch slides again.
 */
export function AccountFooter() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clear);

  function signOut() {
    // Drop cached server data so the next account never sees this one's.
    queryClient.clear();
    clearSession();
  }

  return (
    <View className="px-6">
      <Button
        variant="ghost"
        onPress={() => {
          signOut();
          router.replace('/login');
        }}
      >
        Log Out
      </Button>
      {__DEV__ && (
        <Button
          variant="ghost"
          onPress={async () => {
            await resetWelcomeCarousel();
            signOut();
            router.replace('/welcome');
          }}
        >
          Replay intro (dev only)
        </Button>
      )}
    </View>
  );
}
