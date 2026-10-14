import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bookmark, CircleAlert, Search, SearchX, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreatorCard } from '@/components/domain/discover/CreatorCard';
import { FilterSheet } from '@/components/domain/discover/FilterSheet';
import type { AppBottomSheetRef } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { SkeletonCardGrid } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getApiErrorMessage } from '@/lib/api/client';
import { activeFilterCount, DEFAULT_FILTERS, listCreators, type CreatorFilters } from '@/lib/api/discovery';
import { DISCOVERY_QUERY_KEY } from '@/lib/query-keys';

const SORT_LABEL: Record<CreatorFilters['sort'], string> = {
  newest: 'Newest',
  engagement: 'Highest engagement',
  price_asc: 'Lowest price',
  collabs: 'Most collabs',
  best_value: 'Best value',
};

/** Discover Creators (prompt.md §6.5) — `GET /creators` with the Filter Sheet's params. */
export default function BrandDiscoverTab() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const sheetRef = useRef<AppBottomSheetRef>(null);
  const [filters, setFilters] = useState<CreatorFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');

  const query = useInfiniteQuery({
    queryKey: [...DISCOVERY_QUERY_KEY, 'creators', filters],
    queryFn: ({ pageParam }) => listCreators(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
  });

  // The backend has no text search on this endpoint, so the box narrows what is already loaded.
  const creators = useMemo(() => {
    const all = query.data?.pages.flatMap((p) => p.items) ?? [];
    const q = search.trim().toLowerCase().replace(/^@/, '');
    if (!q) return all;
    return all.filter(
      (c) => c.displayName?.toLowerCase().includes(q) || c.instagramHandle?.toLowerCase().includes(q),
    );
  }, [query.data, search]);

  const count = activeFilterCount(filters);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <View className="gap-4 px-6 pb-3 pt-4">
        <View className="flex-row items-center justify-between">
          <Text variant="h1">Discover</Text>
          <Pressable
            onPress={() => router.push('/brand/saved-lists')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Saved lists"
            className="h-11 flex-row items-center gap-1.5 rounded-md px-2 active:bg-surface"
          >
            <Bookmark size={18} strokeWidth={1.75} color={colors.text.primary} />
            <Text variant="bodySm" weight="medium">
              Saved
            </Text>
          </Pressable>
        </View>
        <Input
          placeholder="Search by name or handle"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<Search size={18} color={colors.text.muted} />}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => sheetRef.current?.present()}
            accessibilityRole="button"
            accessibilityLabel={`Filters${count ? `, ${count} active` : ''}`}
            className="min-h-11 flex-row items-center gap-2 rounded-md border border-border bg-surface px-3 active:bg-base"
          >
            <SlidersHorizontal size={16} color={colors.text.primary} />
            <Text variant="bodySm" weight="medium">
              Filters
            </Text>
            {count > 0 && (
              <View className="min-w-5 items-center rounded-full bg-action px-1.5">
                <Text variant="caption" weight="semibold" color="inverse">
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
          <Text variant="caption" color="secondary" className="flex-1" numberOfLines={1}>
            Sorted by {SORT_LABEL[filters.sort].toLowerCase()}
          </Text>
        </View>
      </View>

      {query.isPending ? (
        <View className="px-6">
          <SkeletonCardGrid count={4} />
        </View>
      ) : query.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load creators"
          description={getApiErrorMessage(query.error, 'Check your connection and try again.')}
          actionLabel="Try again"
          onAction={() => query.refetch()}
        />
      ) : (
        <FlatList
          data={creators}
          keyExtractor={(c) => c.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerClassName="gap-3 px-6 pb-10 pt-1 flex-grow"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <CreatorCard
              creator={item}
              onPress={() => router.push({ pathname: '/brand/creator/[userId]', params: { userId: item.userId } })}
            />
          )}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          onEndReachedThreshold={0.6}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} tintColor={colors.text.muted} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={SearchX}
              title={search ? `No creators match “${search}”` : 'No creators match these filters'}
              description="Try fewer filters or a different search."
              actionLabel={count > 0 ? 'Clear filters' : undefined}
              onAction={count > 0 ? () => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort }) : undefined}
            />
          }
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.text.muted} className="py-4" /> : null}
        />
      )}

      <FilterSheet
        ref={sheetRef}
        value={filters}
        onApply={(next) => {
          setFilters(next);
          sheetRef.current?.dismiss();
        }}
      />
    </SafeAreaView>
  );
}
