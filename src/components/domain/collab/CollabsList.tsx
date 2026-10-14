import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { CircleAlert, Handshake } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DealCard } from '@/components/domain/collab/DealCard';
import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SkeletonListRow } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDealMutation } from '@/hooks/use-deal-mutation';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getApiErrorMessage } from '@/lib/api/client';
import { acceptDeal, listDeals, rejectDeal, type DealListItem } from '@/lib/api/collabs';
import type { AccountType } from '@/lib/auth/types';
import { CREATOR_COLLAB_TABS, counterpartName } from '@/lib/collab-view';
import { collabListKey } from '@/lib/query-keys';

const PAGE_SIZE = 20;

const BRAND_TABS = [
  { value: 'direct', label: 'Direct' },
  { value: 'campaign', label: 'Campaign' },
] as const;

const EMPTY_COPY: Record<string, { title: string; description: string }> = {
  requests: {
    title: 'No requests right now',
    description: 'Brands send requests for your packages. Stay available and keep your packages up to date.',
  },
  active: { title: 'Nothing in progress', description: 'Accepted collabs move here once the brand pays into escrow.' },
  past: { title: 'No past collabs yet', description: 'Completed, declined and expired collabs are kept here.' },
  direct: {
    title: 'No direct collabs yet',
    description: 'Find a creator in Discover and request one of their packages.',
  },
  campaign: { title: 'No campaign collabs yet', description: 'Creators you invite or approve in a campaign show up here.' },
};

/**
 * My Collabs (prompt.md §6.3) for either role. The backend filters by one status at a time, so
 * the segments (status groups for creators, direct vs campaign for brands) are applied to the
 * loaded pages, and more pages load as the list scrolls.
 */
export function CollabsList({ viewer }: { viewer: AccountType }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [segment, setSegment] = useState<string>(viewer === 'creator' ? 'requests' : 'direct');

  const query = useInfiniteQuery({
    queryKey: collabListKey(),
    queryFn: ({ pageParam }) => listDeals({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });
  useRefetchOnFocus(query.refetch);

  const all = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const items = useMemo(() => filterSegment(all, viewer, segment), [all, viewer, segment]);

  // A segment can be sparse within the first page; keep loading until it fills or runs out.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    if (items.length < 8 && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { ask, sheet } = useConfirmSheet();
  const accept = useDealMutation((id: string) => acceptDeal(id), {
    success: 'Collab accepted',
    successBody: 'The brand has been asked to pay into escrow.',
  });
  const decline = useDealMutation((id: string) => rejectDeal(id), { success: 'Request declined' });

  const tabs = viewer === 'creator' ? CREATOR_COLLAB_TABS.map(({ value, label }) => ({ value, label })) : BRAND_TABS;
  const open = (id: string) => router.push({ pathname: `/${viewer}/collab/[id]`, params: { id } } as unknown as Href);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <View className="gap-4 px-6 pb-3 pt-4">
        <Text variant="h1">Collabs</Text>
        <SegmentedControl options={tabs} value={segment} onChange={setSegment} />
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
          title="Couldn't load your collabs"
          description={getApiErrorMessage(query.error, 'Check your connection and try again.')}
          actionLabel="Try again"
          onAction={() => query.refetch()}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(d) => d.id}
          contentContainerClassName="gap-3 px-6 pb-10 pt-1 flex-grow"
          renderItem={({ item }) => (
            <DealCard
              deal={item}
              viewer={viewer}
              onPress={() => open(item.id)}
              quickActions={
                viewer === 'creator' && segment === 'requests'
                  ? {
                      busy: accept.isPending || decline.isPending,
                      onAccept: () => accept.mutate(item.id),
                      onDecline: () =>
                        ask({
                          title: 'Decline this request?',
                          description: `${counterpartName(item, 'creator')} will be told you passed. This can't be undone.`,
                          confirmLabel: 'Decline',
                          destructive: true,
                          onConfirm: () => decline.mutate(item.id),
                        }),
                    }
                  : undefined
              }
            />
          )}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !isFetchingNextPage}
              onRefresh={() => query.refetch()}
              tintColor={colors.text.muted}
            />
          }
          ListEmptyComponent={
            isFetchingNextPage ? null : (
              <EmptyState icon={Handshake} title={EMPTY_COPY[segment].title} description={EMPTY_COPY[segment].description} />
            )
          }
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.text.muted} className="py-4" /> : null}
        />
      )}
      {sheet}
    </SafeAreaView>
  );
}

function filterSegment(deals: DealListItem[], viewer: AccountType, segment: string): DealListItem[] {
  if (viewer === 'brand') {
    return deals.filter((d) => (segment === 'campaign' ? d.campaignId !== null : d.campaignId === null));
  }
  const group = CREATOR_COLLAB_TABS.find((t) => t.value === segment);
  const statuses: readonly string[] = group?.statuses ?? [];
  const filtered = deals.filter((d) => statuses.includes(d.status));
  // Requests: the one about to expire first (prompt.md §6.4).
  if (segment === 'requests') {
    return [...filtered].sort((a, b) => (a.requestExpiresAt ?? '9').localeCompare(b.requestExpiresAt ?? '9'));
  }
  return filtered;
}
