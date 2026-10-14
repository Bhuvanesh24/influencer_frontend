import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { CircleAlert, Compass, Megaphone } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DashboardSkeleton,
  HomeHeader,
  SectionHeader,
  SectionNote,
  StatTile,
} from '@/components/domain/dashboard/DashboardParts';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyText } from '@/components/ui/MoneyText';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import {
  getBrandDashboard,
  type BrandDashboardCampaign,
  type BrandDashboardDeal,
} from '@/lib/api/brand';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/cn';
import { campaignStatusMeta, dealStatusMeta } from '@/lib/deal-status';
import { BRAND_DASHBOARD_QUERY_KEY } from '@/lib/query-keys';

/** Deals waiting on the brand: a post to verify, or an accepted request to pay for. */
const NEEDS_BRAND = ['post_submitted', 'accepted'];

function CollabRow({ deal, isFirst, onPress }: { deal: BrandDashboardDeal; isFirst: boolean; onPress: () => void }) {
  const status = dealStatusMeta(deal.status);
  const creatorName = deal.creatorProfile?.user.displayName || 'Creator';
  const next =
    deal.status === 'post_submitted' ? 'Verify the post' : deal.status === 'accepted' ? 'Pay to start' : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${creatorName}, ${status.label}`}
      className={cn('flex-row items-center gap-3 px-4 py-3 active:bg-base', !isFirst && 'border-t border-border')}
    >
      <Avatar name={creatorName} uri={deal.creatorProfile?.user.profilePhotoUrl} size="sm" />
      <View className="flex-1 gap-0.5">
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {creatorName}
        </Text>
        <Text variant="caption" color="secondary" numberOfLines={1}>
          {next ?? `${deal.package ? `${deal.package.title} · ` : ''}Post due ${dayjs(deal.postingDeadline).format('D MMM')}`}
        </Text>
      </View>
      <StatusBadge label={status.label} tone={status.tone} />
    </Pressable>
  );
}

function CampaignRow({ campaign, isFirst, onPress }: { campaign: BrandDashboardCampaign; isFirst: boolean; onPress: () => void }) {
  const status = campaignStatusMeta(campaign.status);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${campaign.name}, ${status.label}`}
      className={cn('flex-row items-center gap-3 px-4 py-3 active:bg-base', !isFirst && 'border-t border-border')}
    >
      <View className="flex-1 gap-0.5">
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {campaign.name}
        </Text>
        <Text variant="caption" color="secondary">
          Created {dayjs(campaign.createdAt).format('D MMM YYYY')}
        </Text>
      </View>
      <StatusBadge label={status.label} tone={status.tone} />
    </Pressable>
  );
}

/** Brand Dashboard (prompt.md §6.5) — `GET /brands/me/dashboard`. */
export default function BrandHomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: BRAND_DASHBOARD_QUERY_KEY,
    queryFn: getBrandDashboard,
  });
  useRefetchOnFocus(refetch);

  // The company name once it is saved; until then, the name given at onboarding.
  const brandName = data?.profile.companyName?.trim() || user?.displayName?.trim() || 'Your brand';
  const openDeal = (id: string) => router.push({ pathname: '/brand/collab/[id]', params: { id } });
  const openCampaign = (id: string) => router.push({ pathname: '/brand/campaign/[id]', params: { id } });

  const attention = data?.recentCollabs.filter((d) => NEEDS_BRAND.includes(d.status)) ?? [];
  const others = data?.recentCollabs.filter((d) => !NEEDS_BRAND.includes(d.status)) ?? [];

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
          name={brandName}
          photoUri={data?.profile.logoUrl}
          profileLabel="Open your account"
          onOpenProfile={() => router.push('/brand/account')}
          onOpenNotifications={() => router.push('/brand/notifications')}
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
            {!data.profile.companyName && (
              <View className="mx-6 gap-3 rounded-md bg-selected p-4">
                <View className="gap-0.5">
                  <Text variant="body" weight="semibold">
                    Add your company details
                  </Text>
                  <Text variant="bodySm">Creators see your company profile when you send them a request.</Text>
                </View>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  className="self-start px-4"
                  onPress={() => router.push('/brand/profile')}
                >
                  Set up profile
                </Button>
              </View>
            )}

            <View className="flex-row flex-wrap gap-3 px-6">
              <StatTile label="Total spent">
                <MoneyText amount={data.stats.totalSpent} variant="h2" />
              </StatTile>
              <StatTile label="Active collabs">
                <Text variant="h2">{data.stats.activeCollabs}</Text>
              </StatTile>
              <Pressable
                onPress={() => router.push('/brand/collabs')}
                accessibilityRole="button"
                accessibilityLabel={`${data.stats.pendingApprovals} posts to review`}
                className={cn(
                  'min-w-[45%] flex-1 gap-1 rounded-md border p-4 active:opacity-80',
                  data.stats.pendingApprovals > 0 ? 'border-accent bg-selected' : 'border-border bg-surface',
                )}
              >
                <Text variant="caption" color="secondary">
                  Posts to review
                </Text>
                <Text variant="h2">{data.stats.pendingApprovals}</Text>
              </Pressable>
              <StatTile label="Active campaigns">
                <Text variant="h2">{data.stats.openCampaigns}</Text>
              </StatTile>
            </View>

            <View className="flex-row gap-3 px-6">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                leftIcon={<Compass size={18} color={colors.text.primary} />}
                onPress={() => router.push('/brand/discover')}
              >
                Find creators
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                leftIcon={<Megaphone size={18} color={colors.text.primary} />}
                onPress={() => router.push('/brand/campaign/new')}
              >
                New campaign
              </Button>
            </View>

            {attention.length > 0 && (
              <View className="gap-3">
                <SectionHeader title="Needs your attention" />
                <View className="mx-6 rounded-md border border-accent bg-surface">
                  {attention.map((deal, i) => (
                    <CollabRow key={deal.id} deal={deal} isFirst={i === 0} onPress={() => openDeal(deal.id)} />
                  ))}
                </View>
              </View>
            )}

            <View className="gap-3">
              <SectionHeader
                title="Collabs in progress"
                action={
                  <Pressable onPress={() => router.push('/brand/collabs')} hitSlop={12} accessibilityRole="link" className="py-2 active:opacity-60">
                    <Text variant="bodySm" weight="semibold" color="accent">
                      See all
                    </Text>
                  </Pressable>
                }
              />
              {others.length > 0 ? (
                <View className="mx-6 rounded-md border border-border bg-surface">
                  {others.slice(0, 5).map((deal, i) => (
                    <CollabRow key={deal.id} deal={deal} isFirst={i === 0} onPress={() => openDeal(deal.id)} />
                  ))}
                </View>
              ) : (
                <SectionNote>
                  {attention.length > 0
                    ? 'Everything else is done or waiting on you above.'
                    : 'Nothing in progress. Find a creator in Discover and request one of their packages.'}
                </SectionNote>
              )}
            </View>

            <View className="gap-3">
              <SectionHeader
                title="Your campaigns"
                action={
                  <Pressable onPress={() => router.push('/brand/campaigns')} hitSlop={12} accessibilityRole="link" className="py-2 active:opacity-60">
                    <Text variant="bodySm" weight="semibold" color="accent">
                      See all
                    </Text>
                  </Pressable>
                }
              />
              {data.recentCampaigns.length > 0 ? (
                <View className="mx-6 rounded-md border border-border bg-surface">
                  {data.recentCampaigns.map((campaign, i) => (
                    <CampaignRow key={campaign.id} campaign={campaign} isFirst={i === 0} onPress={() => openCampaign(campaign.id)} />
                  ))}
                </View>
              ) : (
                <SectionNote>No campaigns yet. A campaign lets you work with several creators on one brief.</SectionNote>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
