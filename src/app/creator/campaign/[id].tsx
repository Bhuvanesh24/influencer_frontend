import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, CircleAlert, X } from 'lucide-react-native';
import { View } from 'react-native';

import { CAMPAIGN_TYPE_META } from '@/components/domain/campaigns/CampaignCard';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonDetailPage } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getCampaign, getMyApplications } from '@/lib/api/campaigns';
import { getApiErrorMessage } from '@/lib/api/client';
import { getMyCreatorProfile } from '@/lib/api/creator';
import { contentTypeLabel } from '@/lib/constants';
import { formatMoney } from '@/lib/money';
import { CAMPAIGNS_QUERY_KEY, CREATOR_PROFILE_QUERY_KEY } from '@/lib/query-keys';

const RANGE_FLOOR: Record<string, number> = {
  under_1k: 0,
  range_1k_10k: 1000,
  range_10k_50k: 10000,
  range_50k_100k: 50000,
  range_100k_500k: 100000,
  range_500k_1m: 500000,
  range_1m_plus: 1000000,
};

/** Campaign Detail, creator view (prompt.md §6.4): brief, requirements checked against you, Apply. */
export default function CreatorCampaignScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaign = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'detail', id], queryFn: () => getCampaign(id) });
  const profile = useQuery({ queryKey: CREATOR_PROFILE_QUERY_KEY, queryFn: getMyCreatorProfile });
  const mine = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'mine'], queryFn: getMyApplications });

  if (campaign.isPending) {
    return (
      <Screen contentClassName="pt-2">
        <ScreenHeader />
        <SkeletonDetailPage />
      </Screen>
    );
  }
  if (campaign.isError) {
    return (
      <Screen contentClassName="pt-2">
        <ScreenHeader />
        <EmptyState icon={CircleAlert} title="Couldn't load this campaign" description={getApiErrorMessage(campaign.error)} actionLabel="Try again" onAction={() => campaign.refetch()} />
      </Screen>
    );
  }

  const c = campaign.data;
  const brand = c.brandProfile?.companyName ?? 'A brand';
  const applied = mine.data?.find((a) => a.campaign.id === c.id);
  const myFloor = RANGE_FLOOR[profile.data?.instagramFollowerRange ?? ''] ?? 0;
  const myNiches = new Set((profile.data?.niches ?? []).map((n) => n.toLowerCase()));

  const checks = [
    c.targetNiches.length > 0 && {
      label: `Niche: ${c.targetNiches.join(', ')}`,
      met: c.targetNiches.some((n) => myNiches.has(n.toLowerCase())),
    },
    c.minFollowerCount && {
      label: `At least ${c.minFollowerCount.toLocaleString('en-IN')} Instagram followers`,
      met: myFloor >= c.minFollowerCount,
    },
    c.minEngagementRate && {
      label: `At least ${Number(c.minEngagementRate)}% engagement`,
      met: null,
    },
  ].filter(Boolean) as { label: string; met: boolean | null }[];

  const open = c.type === 'OpenApplication' && c.status === 'active' && !!c.applicationDeadline && dayjs(c.applicationDeadline).isAfter(dayjs());
  const full = c.maxCreators != null && c.usedSlots >= c.maxCreators;
  const blocked = checks.some((x) => x.met === false);

  return (
    <Screen scroll contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader />
      <View className="gap-3">
        <View className="flex-row items-center gap-3">
          <Avatar name={brand} uri={c.brandProfile?.logoUrl} size="md" />
          <View className="flex-1">
            <Text variant="caption" color="secondary">
              {brand} · {CAMPAIGN_TYPE_META[c.type].label}
            </Text>
            <Text variant="h2">{c.name}</Text>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {c.applicationDeadline && open && <CountdownChip until={c.applicationDeadline} label="Apply by" />}
          {c.maxCreators != null && (
            <View className="rounded-full bg-selected px-2.5 py-1">
              <Text variant="caption" weight="semibold">
                {Math.max(0, c.maxCreators - c.usedSlots)} of {c.maxCreators} spots left
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row gap-3">
        <Fact label="You'd earn" value={c.budgetPerCreator ? formatMoney(c.budgetPerCreator) : '—'} note="before the 10% platform fee" />
        <Fact label="Content" value={contentTypeLabel(c.contentType)} note={`post by ${dayjs(c.postingDeadline).format('D MMM')}`} />
      </View>

      <View className="gap-2">
        <Text variant="h3">Brief</Text>
        <Text variant="body">{c.brief}</Text>
        {c.productDescription && (
          <Text variant="bodySm" color="secondary">
            Product: {c.productDescription}
          </Text>
        )}
        {c.hashtags.length > 0 && (
          <Text variant="bodySm" color="secondary">
            {c.hashtags.join(' ')}
          </Text>
        )}
        {c.requiresDraftApproval && (
          <Text variant="bodySm" color="secondary">
            The brand reviews a draft before you post.
          </Text>
        )}
      </View>

      {checks.length > 0 && (
        <View className="gap-3 rounded-md border border-border bg-surface p-4">
          <Text variant="h3">Requirements</Text>
          {checks.map((x) => (
            <View key={x.label} className="flex-row items-center gap-2">
              {x.met === false ? (
                <X size={16} color={colors.status.danger} />
              ) : (
                <Check size={16} color={x.met ? colors.accent.primary : colors.text.muted} />
              )}
              <Text variant="bodySm" className="flex-1">
                {x.label}
              </Text>
              <Text variant="caption" color={x.met === false ? 'danger' : 'secondary'}>
                {x.met === null ? 'Checked on apply' : x.met ? 'You meet this' : 'Not met'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {applied ? (
        <View className="gap-2 rounded-md border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text variant="body" weight="semibold">
              You applied
            </Text>
            <StatusBadge
              label={applied.status === 'pending' ? 'Waiting for the brand' : applied.status === 'approved' ? 'Approved' : 'Not selected'}
              tone={applied.status === 'approved' ? 'positive' : applied.status === 'pending' ? 'info' : 'neutral'}
            />
          </View>
          {applied.deal && (
            <Button variant="secondary" onPress={() => router.push({ pathname: '/creator/collab/[id]', params: { id: applied.deal!.id } })}>
              Open the collab request
            </Button>
          )}
        </View>
      ) : (
        <View className="gap-2">
          <Button size="lg" disabled={!open || full || blocked} onPress={() => router.push({ pathname: '/creator/campaign/apply', params: { id: c.id } })}>
            Apply
          </Button>
          {(!open || full || blocked) && (
            <Text variant="caption" color="secondary" className="text-center">
              {!open ? 'Applications are closed.' : full ? 'All spots are filled.' : 'You don’t meet the requirements above.'}
            </Text>
          )}
          {open && !full && !blocked && c.autoAccept && (
            <Text variant="caption" color="secondary" className="text-center">
              This brand auto-accepts eligible applicants while spots last.
            </Text>
          )}
        </View>
      )}
    </Screen>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-md border border-border bg-surface p-4">
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <Text variant="h3">{value}</Text>
      <Text variant="caption" color="muted">
        {note}
      </Text>
    </View>
  );
}
