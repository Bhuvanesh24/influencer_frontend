import { useInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { CircleAlert, Receipt } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyText } from '@/components/ui/MoneyText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonListRow } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getBillingHistory } from '@/lib/api/billing';
import { getApiErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { escrowBadge } from '@/lib/payout-accounts';
import { WALLET_QUERY_KEY } from '@/lib/query-keys';

/** Billing & Transactions (prompt.md §6.5): every escrow payment, newest first. */
export default function BillingScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const query = useInfiniteQuery({
    queryKey: [...WALLET_QUERY_KEY, 'billing'],
    queryFn: ({ pageParam }) => getBillingHistory(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
  });
  useRefetchOnFocus(query.refetch);
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <View className="px-6">
        <ScreenHeader title="Billing" />
      </View>
      {query.isPending ? (
        <View className="gap-3 px-6">
          <SkeletonListRow />
          <SkeletonListRow />
        </View>
      ) : query.isError ? (
        <EmptyState icon={CircleAlert} title="Couldn't load billing" description={getApiErrorMessage(query.error)} actionLabel="Try again" onAction={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          contentContainerClassName="flex-grow px-6 pb-10 pt-2"
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.text.muted} />}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          renderItem={({ item, index }) => {
            const badge = escrowBadge(item.status);
            const name = item.deal.creatorProfile.user.displayName ?? 'Creator';
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/brand/billing/[id]', params: { id: item.id } })}
                accessibilityRole="button"
                className={cn(
                  'flex-row items-center gap-3 border-x border-border bg-surface p-4 active:bg-base',
                  index === 0 && 'rounded-t-md border-t',
                  index === items.length - 1 && 'rounded-b-md border-b',
                  index > 0 && 'border-t',
                )}
              >
                <Avatar name={name} uri={item.deal.creatorProfile.user.profilePhotoUrl} size="sm" />
                <View className="flex-1 gap-1">
                  <Text variant="body" weight="semibold" numberOfLines={1}>
                    {name}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {item.deal.dealNumber} · {dayjs(item.lockedAt).format('D MMM YYYY')}
                  </Text>
                  <StatusBadge label={badge.label} tone={badge.tone} />
                </View>
                <MoneyText amount={item.amount} variant="h3" />
              </Pressable>
            );
          }}
          ListEmptyComponent={<EmptyState icon={Receipt} title="No payments yet" description="Payments appear here once you pay into escrow for a collab." />}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.text.muted} className="py-4" /> : null}
        />
      )}
    </SafeAreaView>
  );
}
