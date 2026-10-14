import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import {
  BadgeCheck,
  Bell,
  CircleAlert,
  FileText,
  Handshake,
  Megaphone,
  ShieldAlert,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonListRow } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AccountType } from '@/lib/auth/types';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@/lib/api/notifications';
import { cn } from '@/lib/cn';
import { fromNow } from '@/lib/dates';
import { NOTIFICATIONS_QUERY_KEY } from '@/lib/query-keys';

const ICONS: Record<string, LucideIcon> = {
  collab_request: Handshake,
  collab_accepted: Handshake,
  collab_rejected: Handshake,
  counter_offer_received: Handshake,
  counter_offer_accepted: Handshake,
  counter_offer_rejected: Handshake,
  payment_prompt: Wallet,
  payout_released: Wallet,
  post_submitted: FileText,
  verification_reminder: FileText,
  deadline_reminder: FileText,
  dispute_update: ShieldAlert,
  strike_received: ShieldAlert,
  campaign_update: Megaphone,
  application_update: Megaphone,
  verification_approved: BadgeCheck,
  stats_submitted: BadgeCheck,
};

/** Notifications (prompt.md §6.3): newest first; tapping marks read and opens what it's about. */
export function NotificationsScreen({ viewer }: { viewer: AccountType }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, 'list'],
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const unread = query.data?.pages[0]?.unreadCount ?? 0;

  const refresh = () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
  const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh });

  function open(n: AppNotification) {
    if (!n.isRead) markNotificationRead(n.id).then(refresh);
    if (n.dealId) {
      router.push({ pathname: `/${viewer}/collab/[id]`, params: { id: n.dealId } } as unknown as Href);
    } else if (n.campaignId) {
      router.push({ pathname: `/${viewer}/campaign/[id]`, params: { id: n.campaignId } } as unknown as Href);
    }
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <View className="px-6">
        <ScreenHeader
          title="Notifications"
          right={
            unread > 0 ? (
              <Pressable
                onPress={() => readAll.mutate()}
                hitSlop={8}
                accessibilityRole="button"
                className="h-11 justify-center px-1 active:opacity-60"
              >
                <Text variant="bodySm" weight="semibold" color="accent">
                  Mark all read
                </Text>
              </Pressable>
            ) : undefined
          }
        />
      </View>
      {query.isPending ? (
        <View className="gap-3 px-6">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonListRow key={i} />
          ))}
        </View>
      ) : query.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load notifications"
          description={getApiErrorMessage(query.error)}
          actionLabel="Try again"
          onAction={() => query.refetch()}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerClassName="flex-grow pb-10"
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.text.muted} />}
          renderItem={({ item, index }) => {
            const Icon = ICONS[item.type] ?? Bell;
            return (
              <Pressable
                onPress={() => open(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.isRead ? '' : 'Unread. '}${item.title}`}
                className={cn('flex-row gap-3 px-6 py-4 active:bg-surface', index > 0 && 'border-t border-border', !item.isRead && 'bg-surface')}
              >
                {!item.isRead && <View className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-accent" />}
                <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-base">
                  <Icon size={18} strokeWidth={1.5} color={colors.text.primary} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text variant="body" weight={item.isRead ? 'regular' : 'semibold'}>
                    {item.title}
                  </Text>
                  {item.body && (
                    <Text variant="bodySm" color="secondary" numberOfLines={2}>
                      {item.body}
                    </Text>
                  )}
                  <Text variant="caption" color="muted">
                    {fromNow(item.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={<EmptyState icon={Bell} title="You're all caught up." description="Updates on your collabs and payments appear here." />}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.text.muted} className="py-4" /> : null}
        />
      )}
    </SafeAreaView>
  );
}
