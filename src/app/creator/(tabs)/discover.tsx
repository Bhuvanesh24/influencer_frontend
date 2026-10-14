import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronRight, CircleAlert, Compass, Tags } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CampaignCard } from '@/components/domain/campaigns/CampaignCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonListRow } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getMyApplications, listOpenCampaigns } from '@/lib/api/campaigns';
import { getApiErrorMessage } from '@/lib/api/client';
import { getMyCreatorProfile } from '@/lib/api/creator';
import { CONTENT_TYPES, type ContentType } from '@/lib/constants';
import { CAMPAIGNS_QUERY_KEY, CREATOR_PROFILE_QUERY_KEY } from '@/lib/query-keys';

/** Open Campaigns (prompt.md §6.4): campaigns this creator is eligible to apply to. */
export default function CreatorDiscoverTab() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [contentType, setContentType] = useState<ContentType | undefined>();
  const [niche, setNiche] = useState<string | undefined>();

  const profile = useQuery({ queryKey: CREATOR_PROFILE_QUERY_KEY, queryFn: getMyCreatorProfile });
  const applications = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'mine'], queryFn: getMyApplications });
  const query = useInfiniteQuery({
    queryKey: [...CAMPAIGNS_QUERY_KEY, 'open', contentType ?? '', niche ?? ''],
    queryFn: ({ pageParam }) => listOpenCampaigns({ contentType, niche }, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
  });
  useRefetchOnFocus(query.refetch);
  useRefetchOnFocus(applications.refetch);

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const hasNiches = (profile.data?.niches.length ?? 0) > 0;
  const pending = (applications.data ?? []).filter((a) => a.status === 'pending').length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        contentContainerClassName="flex-grow gap-3 px-6 pb-10 pt-4"
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.text.muted} />}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        ListHeaderComponent={
          <View className="gap-4 pb-2">
            <View className="gap-1">
              <Text variant="h1">Campaigns</Text>
              <Text variant="body" color="secondary">
                Open campaigns that fit your profile. Apply with one of your packages.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/creator/applications')}
              accessibilityRole="button"
              className="flex-row items-center justify-between rounded-md border border-border bg-surface px-4 py-3 active:bg-base"
            >
              <Text variant="body" weight="medium">
                My applications
              </Text>
              <View className="flex-row items-center gap-2">
                {pending > 0 && (
                  <Text variant="caption" color="secondary">
                    {pending} waiting
                  </Text>
                )}
                <ChevronRight size={18} color={colors.text.muted} />
              </View>
            </Pressable>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2" className="-mx-6 px-6">
              <Chip label="All types" selectable selected={!contentType} onPress={() => setContentType(undefined)} />
              {CONTENT_TYPES.map((c) => (
                <Chip key={c.value} label={c.label} selectable selected={contentType === c.value} onPress={() => setContentType(contentType === c.value ? undefined : c.value)} />
              ))}
            </ScrollView>
            {hasNiches && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2" className="-mx-6 px-6">
                <Chip label="All my niches" selectable selected={!niche} onPress={() => setNiche(undefined)} />
                {profile.data!.niches.map((n) => (
                  <Chip key={n} label={n} selectable selected={niche === n} onPress={() => setNiche(niche === n ? undefined : n)} />
                ))}
              </ScrollView>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <CampaignCard
            type={item.type}
            name={item.name}
            brandName={item.brandProfile.companyName}
            contentType={item.contentType}
            money={{ amount: item.budgetPerCreator, suffix: 'per creator' }}
            slots={item.maxCreators ? { filled: item.usedSlots, total: item.maxCreators, mode: 'remaining' } : undefined}
            deadline={{ at: item.applicationDeadline, label: 'Apply by' }}
            onPress={() => router.push({ pathname: '/creator/campaign/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          query.isPending ? (
            <View className="gap-3">
              <SkeletonListRow />
              <SkeletonListRow />
            </View>
          ) : query.isError ? (
            <EmptyState icon={CircleAlert} title="Couldn't load campaigns" description={getApiErrorMessage(query.error)} actionLabel="Try again" onAction={() => query.refetch()} />
          ) : !hasNiches ? (
            <EmptyState
              icon={Tags}
              title="Add niches to see matching campaigns"
              description="Campaigns target niches. Tell brands what you create and the matching ones show up here."
              actionLabel="Add niches"
              onAction={() => router.push('/creator/profile')}
            />
          ) : (
            <EmptyState icon={Compass} title="No matching campaigns right now" description="Check back soon." />
          )
        }
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.text.muted} className="py-4" /> : null}
      />
    </SafeAreaView>
  );
}
