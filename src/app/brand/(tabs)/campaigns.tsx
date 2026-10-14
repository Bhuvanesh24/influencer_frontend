import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CircleAlert, Megaphone, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CampaignCard } from '@/components/domain/campaigns/CampaignCard';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonListRow } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { listCampaigns, type CampaignStatus } from '@/lib/api/campaigns';
import { getApiErrorMessage } from '@/lib/api/client';
import { CAMPAIGNS_QUERY_KEY } from '@/lib/query-keys';

const FILTERS: { value: CampaignStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** Campaigns List (prompt.md §6.5). */
export default function BrandCampaignsTab() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all');
  const status = filter === 'all' ? undefined : filter;
  const query = useInfiniteQuery({
    queryKey: [...CAMPAIGNS_QUERY_KEY, 'list', filter],
    queryFn: ({ pageParam }) => listCampaigns(pageParam, status),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
  });
  useRefetchOnFocus(query.refetch);
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <View className="gap-4 pb-3 pt-4">
        <Text variant="h1" className="px-6">
          Campaigns
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-6">
          {FILTERS.map((f) => (
            <Chip key={f.value} label={f.label} selectable selected={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </ScrollView>
      </View>

      {query.isPending ? (
        <View className="gap-3 px-6">
          <SkeletonListRow />
          <SkeletonListRow />
        </View>
      ) : query.isError ? (
        <EmptyState icon={CircleAlert} title="Couldn't load campaigns" description={getApiErrorMessage(query.error)} actionLabel="Try again" onAction={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerClassName="flex-grow gap-3 px-6 pb-28 pt-1"
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.text.muted} />}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          renderItem={({ item }) => (
            <CampaignCard
              type={item.type}
              name={item.name}
              contentType={item.contentType}
              status={item.status}
              money={
                item.type === 'OpenApplication'
                  ? { amount: item.budgetPerCreator, suffix: 'per creator' }
                  : { amount: item.totalBudget, suffix: 'budget' }
              }
              slots={{
                filled: item.type === 'OpenApplication' ? item.usedSlots : (item._count?.campaignCreators ?? 0),
                total: item.type === 'OpenApplication' ? (item.maxCreators ?? 0) : item.targetInfluencerCount,
                mode: 'progress',
              }}
              deadline={
                item.status === 'active' && item.type === 'OpenApplication' && item.applicationDeadline
                  ? { at: item.applicationDeadline, label: 'Applications close' }
                  : null
              }
              onPress={() => router.push({ pathname: '/brand/campaign/[id]', params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Megaphone}
              title={filter === 'all' ? 'No campaigns yet' : `No ${filter} campaigns`}
              description="A campaign lets you work with several creators on one brief — invite them yourself or let them apply."
            />
          }
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.text.muted} className="py-4" /> : null}
        />
      )}

      <View className="absolute bottom-4 left-6 right-6">
        <Button size="lg" leftIcon={<Plus size={18} color={colors.text.inverse} />} onPress={() => router.push('/brand/campaign/new')}>
          Create campaign
        </Button>
      </View>
    </SafeAreaView>
  );
}
