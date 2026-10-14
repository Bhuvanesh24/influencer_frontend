import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { ChevronRight, CircleAlert } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CampaignCard } from '@/components/domain/campaigns/CampaignCard';
import { TrustScoreSheet } from '@/components/domain/creator/TrustScoreSheet';
import {
  DashboardSkeleton,
  HomeHeader,
  SectionHeader,
  SectionNote,
  StatTile,
} from '@/components/domain/dashboard/DashboardParts';
import { StatusBadge, TrustBadge } from '@/components/ui/Badge';
import type { AppBottomSheetRef } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyText } from '@/components/ui/MoneyText';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { listOpenCampaigns } from '@/lib/api/campaigns';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  getCreatorDashboard,
  getMyCreatorProfile,
  updateCreatorProfile,
  type CreatorDashboard,
  type DashboardDeal,
} from '@/lib/api/creator';
import { useAuthStore } from '@/lib/auth/store';
import { contentTypeLabel } from '@/lib/constants';
import { dealStatusMeta } from '@/lib/deal-status';
import { haptics } from '@/lib/haptics';
import { CAMPAIGNS_QUERY_KEY, CREATOR_DASHBOARD_QUERY_KEY, CREATOR_PROFILE_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';

function brandName(deal: DashboardDeal): string {
  // Brands can choose to stay unnamed until a deal is active (see Brand Profile Setup).
  return deal.brandProfile?.companyName || 'A Brand';
}

function RequestCard({ deal, onPress }: { deal: DashboardDeal; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Request from ${brandName(deal)}`}
      className="w-64 gap-3 rounded-md border border-border bg-surface p-4 active:bg-base"
    >
      <View className="gap-0.5">
        <Text variant="h3" numberOfLines={1}>
          {brandName(deal)}
        </Text>
        {deal.package && (
          <Text variant="bodySm" color="secondary" numberOfLines={2}>
            {deal.package.title} · {deal.package.quantity} × {contentTypeLabel(deal.package.contentType)}
          </Text>
        )}
      </View>
      <View className="flex-row items-end justify-between gap-2">
        <View>
          <Text variant="caption" color="secondary">
            Offered
          </Text>
          <MoneyText amount={deal.offeredAmount} variant="h3" />
        </View>
        {deal.requestExpiresAt ? (
          <CountdownChip until={deal.requestExpiresAt} />
        ) : (
          <Text variant="caption" color="muted">
            Received {dayjs(deal.createdAt).format('D MMM')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function ActiveCollabRow({ deal, isFirst, onPress }: { deal: DashboardDeal; isFirst: boolean; onPress: () => void }) {
  const status = dealStatusMeta(deal.status);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${brandName(deal)}, ${status.label}`}
      className={
        isFirst
          ? 'flex-row items-center gap-3 px-4 py-3 active:bg-base'
          : 'flex-row items-center gap-3 border-t border-border px-4 py-3 active:bg-base'
      }
    >
      <View className="flex-1 gap-0.5">
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {brandName(deal)}
        </Text>
        <Text variant="caption" color="secondary">
          {deal.dealNumber} · Post due {dayjs(deal.postingDeadline).format('D MMM')}
        </Text>
      </View>
      <StatusBadge label={status.label} tone={status.tone} />
    </Pressable>
  );
}

/** Creator Dashboard (prompt.md §6.4) — `GET /creators/me/dashboard`. */
export default function CreatorHomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const trustSheetRef = useRef<AppBottomSheetRef>(null);

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: CREATOR_DASHBOARD_QUERY_KEY,
    queryFn: getCreatorDashboard,
  });
  useRefetchOnFocus(refetch);
  const campaigns = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'home-preview'], queryFn: () => listOpenCampaigns({}) });
  // Only for the header photo; the profile screen shares this query.
  const { data: profile } = useQuery({ queryKey: CREATOR_PROFILE_QUERY_KEY, queryFn: getMyCreatorProfile });

  // Instant-save switch: flip the cached value now, roll back with a toast if the save fails.
  const availability = useMutation({
    mutationFn: (isAvailable: boolean) => updateCreatorProfile({ isAvailable }),
    onMutate: async (isAvailable) => {
      await queryClient.cancelQueries({ queryKey: CREATOR_DASHBOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<CreatorDashboard>(CREATOR_DASHBOARD_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<CreatorDashboard>(CREATOR_DASHBOARD_QUERY_KEY, {
          ...previous,
          profile: { ...previous.profile, isAvailable },
        });
      }
      return { previous };
    },
    onError: (err, _isAvailable, context) => {
      if (context?.previous) queryClient.setQueryData(CREATOR_DASHBOARD_QUERY_KEY, context.previous);
      toast.error('Could not update availability', getApiErrorMessage(err));
    },
  });

  const displayName = user?.displayName?.trim() || 'Creator';
  const openDeal = (id: string) => router.push({ pathname: '/creator/collab/[id]', params: { id } });
  const firstName = displayName.split(/\s+/)[0];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <ScrollView
        contentContainerClassName="flex-grow gap-8 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.text.muted} />
        }
      >
        <HomeHeader
          name={firstName}
          photoUri={profile?.profilePhotoUrl}
          profileLabel="Open your profile"
          onOpenProfile={() => router.push('/creator/profile')}
          onOpenNotifications={() => router.push('/creator/notifications')}
        />

        {isPending ? (
          <DashboardSkeleton />
        ) : isError ? (
          <EmptyState
            icon={CircleAlert}
            title="Couldn't load your dashboard"
            description={getApiErrorMessage(error, 'Check your connection and try again.')}
            actionLabel="Try again"
            onAction={() => refetch()}
          />
        ) : (
          <>
            <View className="gap-3 px-6">
              {/* The single most important creator control (prompt.md §6.4) — kept at the top. */}
              <View className="flex-row items-center gap-3 rounded-md border border-border bg-surface p-4">
                <View className="flex-1 gap-0.5">
                  <Text variant="body" weight="semibold">
                    {data.profile.isAvailable ? 'Available for collabs' : 'Not taking requests'}
                  </Text>
                  <Text variant="bodySm" color="secondary">
                    {data.profile.isAvailable
                      ? 'Brands can send you requests.'
                      : 'Brands see you as unavailable.'}
                  </Text>
                </View>
                <Switch
                  value={data.profile.isAvailable}
                  onValueChange={(next) => {
                    haptics.selection();
                    availability.mutate(next);
                  }}
                  trackColor={{ true: colors.accent.primary }}
                  accessibilityLabel="Available for collabs"
                />
              </View>

              {data.profile.profileCompleteness < 100 && (
                <View className="gap-3 rounded-md bg-selected p-4">
                  <View className="gap-0.5">
                    <Text variant="body" weight="semibold">
                      Finish your profile
                    </Text>
                    <Text variant="bodySm">
                      Your profile is {data.profile.profileCompleteness}% complete. Brands see whatever
                      you have filled in.
                    </Text>
                  </View>
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    className="self-start px-4"
                    onPress={() => router.push('/creator/profile')}
                  >
                    Finish profile
                  </Button>
                </View>
              )}
            </View>

            <View className="gap-3 px-6">
              <View className="flex-row flex-wrap gap-3">
                <StatTile label="Total earned (paid out)">
                  <MoneyText amount={data.stats.lifetimeEarnings} variant="h2" tone="positive" />
                </StatTile>
                <StatTile label="Pending payout">
                  <MoneyText amount={data.stats.pendingPayout} variant="h2" tone="held" />
                </StatTile>
                <StatTile label="Active collabs">
                  <Text variant="h2">{data.stats.activeCollabs}</Text>
                </StatTile>
                <StatTile label="New requests">
                  <Text variant="h2">{data.stats.newRequests}</Text>
                </StatTile>
              </View>
              <Pressable
                onPress={() => trustSheetRef.current?.present()}
                accessibilityRole="button"
                accessibilityLabel="Trust Score. How it works"
                className="min-h-13 flex-row items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 active:bg-base"
              >
                <View className="gap-1">
                  <Text variant="caption" color="secondary">
                    Trust Score
                  </Text>
                  <TrustBadge score={data.profile.trustScore} />
                </View>
                <ChevronRight size={20} color={colors.text.muted} />
              </Pressable>
            </View>

            <View className="gap-3">
              <SectionHeader
                title="Incoming requests"
                action={
                  data.recentRequests.length > 0 ? (
                    <Pressable
                      onPress={() => router.push('/creator/collabs')}
                      hitSlop={12}
                      accessibilityRole="link"
                      className="py-2 active:opacity-60"
                    >
                      <Text variant="bodySm" weight="semibold" color="accent">
                        See all
                      </Text>
                    </Pressable>
                  ) : undefined
                }
              />
              {data.recentRequests.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-3 px-6"
                >
                  {data.recentRequests.map((deal) => (
                    <RequestCard key={deal.id} deal={deal} onPress={() => openDeal(deal.id)} />
                  ))}
                </ScrollView>
              ) : (
                <SectionNote>
                  No requests yet. Brands can send one once you have an active package and are marked
                  available.
                </SectionNote>
              )}
            </View>

            <View className="gap-3">
              <SectionHeader title="Active collabs" />
              {data.activeCollabsList.length > 0 ? (
                <View className="mx-6 rounded-md border border-border bg-surface">
                  {data.activeCollabsList.slice(0, 3).map((deal, i) => (
                    <ActiveCollabRow key={deal.id} deal={deal} isFirst={i === 0} onPress={() => openDeal(deal.id)} />
                  ))}
                </View>
              ) : (
                <SectionNote>Nothing in progress. Accepted collabs show up here with their deadlines.</SectionNote>
              )}
            </View>

            {(campaigns.data?.items.length ?? 0) > 0 && (
              <View className="gap-3">
                <SectionHeader
                  title="Campaigns for you"
                  action={
                    <Pressable onPress={() => router.push('/creator/discover')} hitSlop={12} accessibilityRole="link" className="py-2 active:opacity-60">
                      <Text variant="bodySm" weight="semibold" color="accent">
                        See all
                      </Text>
                    </Pressable>
                  }
                />
                <View className="gap-3 px-6">
                  {campaigns.data!.items.slice(0, 2).map((c) => (
                    <CampaignCard
                      key={c.id}
                      type={c.type}
                      name={c.name}
                      brandName={c.brandProfile.companyName}
                      contentType={c.contentType}
                      money={{ amount: c.budgetPerCreator, suffix: 'per creator' }}
                      slots={c.maxCreators ? { filled: c.usedSlots, total: c.maxCreators, mode: 'remaining' } : undefined}
                      deadline={{ at: c.applicationDeadline, label: 'Apply by' }}
                      onPress={() => router.push({ pathname: '/creator/campaign/[id]', params: { id: c.id } })}
                    />
                  ))}
                </View>
              </View>
            )}

          </>
        )}
      </ScrollView>

      <TrustScoreSheet ref={trustSheetRef} score={data?.profile.trustScore ?? 'medium'} />
    </SafeAreaView>
  );
}
