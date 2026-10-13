import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { CircleAlert } from 'lucide-react-native';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AccountFooter,
  DashboardSkeleton,
  NavRow,
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

function CollabRow({ deal, isFirst }: { deal: BrandDashboardDeal; isFirst: boolean }) {
  const status = dealStatusMeta(deal.status);
  const creatorName = deal.creatorProfile?.user.displayName || 'Creator';

  return (
    <View className={cn('flex-row items-center gap-3 px-4 py-3', !isFirst && 'border-t border-border')}>
      <Avatar name={creatorName} uri={deal.creatorProfile?.user.profilePhotoUrl} size="sm" />
      <View className="flex-1 gap-0.5">
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {creatorName}
        </Text>
        <Text variant="caption" color="secondary" numberOfLines={1}>
          {deal.package ? `${deal.package.title} · ` : ''}Post due {dayjs(deal.postingDeadline).format('D MMM')}
        </Text>
      </View>
      <StatusBadge label={status.label} tone={status.tone} />
    </View>
  );
}

function CampaignRow({ campaign, isFirst }: { campaign: BrandDashboardCampaign; isFirst: boolean }) {
  const status = campaignStatusMeta(campaign.status);

  return (
    <View className={cn('flex-row items-center gap-3 px-4 py-3', !isFirst && 'border-t border-border')}>
      <View className="flex-1 gap-0.5">
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {campaign.name}
        </Text>
        <Text variant="caption" color="secondary">
          Created {dayjs(campaign.createdAt).format('D MMM YYYY')}
        </Text>
      </View>
      <StatusBadge label={status.label} tone={status.tone} />
    </View>
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

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <ScrollView
        contentContainerClassName="flex-grow gap-8 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.text.muted} />
        }
      >
        <View className="flex-row items-center gap-3 px-6">
          <Avatar name={brandName} uri={data?.profile.logoUrl} size="md" />
          <View className="flex-1">
            <Text variant="caption" color="secondary">
              Welcome back
            </Text>
            <Text variant="h2" numberOfLines={1}>
              {brandName}
            </Text>
          </View>
        </View>

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
                  <Text variant="bodySm">
                    Creators see your company profile when you send them a request.
                  </Text>
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
              <StatTile label="Posts to review">
                <Text variant="h2">{data.stats.pendingApprovals}</Text>
              </StatTile>
              <StatTile label="Active campaigns">
                <Text variant="h2">{data.stats.openCampaigns}</Text>
              </StatTile>
            </View>

            <View className="gap-3">
              <SectionHeader title="Collabs in progress" />
              {data.recentCollabs.length > 0 ? (
                <View className="mx-6 rounded-md border border-border bg-surface">
                  {data.recentCollabs.slice(0, 5).map((deal, i) => (
                    <CollabRow key={deal.id} deal={deal} isFirst={i === 0} />
                  ))}
                </View>
              ) : (
                <SectionNote>
                  Nothing in progress. Collabs appear here once a creator accepts your request.
                </SectionNote>
              )}
            </View>

            <View className="gap-3">
              <SectionHeader title="Your campaigns" />
              {data.recentCampaigns.length > 0 ? (
                <View className="mx-6 rounded-md border border-border bg-surface">
                  {data.recentCampaigns.map((campaign, i) => (
                    <CampaignRow key={campaign.id} campaign={campaign} isFirst={i === 0} />
                  ))}
                </View>
              ) : (
                <SectionNote>No campaigns yet.</SectionNote>
              )}
            </View>

            <View className="gap-3 px-6">
              <NavRow
                title="Company profile"
                subtitle="Your name, industry, contact details and GSTIN."
                onPress={() => router.push('/brand/profile')}
              />
            </View>
          </>
        )}

        <AccountFooter />
      </ScrollView>
    </SafeAreaView>
  );
}
