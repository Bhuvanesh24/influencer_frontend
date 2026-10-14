import { Bell, ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useUnreadCounts } from '@/hooks/use-inbox-badge';

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
 * Home's top row: avatar + name (opens the profile / account screen) and the notifications bell
 * with an unread dot. Shared so both roles' Homes start the same way.
 */
export function HomeHeader({
  name,
  photoUri,
  onOpenProfile,
  profileLabel,
  onOpenNotifications,
}: {
  name: string;
  photoUri?: string | null;
  onOpenProfile: () => void;
  profileLabel: string;
  onOpenNotifications: () => void;
}) {
  const { colors } = useAppTheme();
  const { notifications } = useUnreadCounts();
  return (
    <View className="flex-row items-center gap-2 px-6">
      <Pressable
        onPress={onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel={`${name}. ${profileLabel}`}
        className="flex-1 flex-row items-center gap-3 rounded-md py-1 active:opacity-70"
      >
        <Avatar name={name} uri={photoUri} size="md" />
        <View className="flex-1">
          <Text variant="caption" color="secondary">
            Welcome back
          </Text>
          <View className="flex-row items-center gap-1">
            <Text variant="h2" numberOfLines={1} className="shrink">
              {name}
            </Text>
            <ChevronRight size={18} color={colors.text.muted} />
          </View>
        </View>
      </Pressable>
      <Pressable
        onPress={onOpenNotifications}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Notifications${notifications ? `, ${notifications} unread` : ''}`}
        className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface active:bg-base"
      >
        <Bell size={20} strokeWidth={1.75} color={colors.text.primary} />
        {notifications > 0 && <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger" />}
      </Pressable>
    </View>
  );
}
