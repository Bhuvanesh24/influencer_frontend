import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleAlert, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CAMPAIGN_TYPE_META } from '@/components/domain/campaigns/CampaignCard';
import { Avatar } from '@/components/ui/Avatar';
import { FollowerRangeLabels, StatusBadge, TrustBadge, type FollowerRange } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyText } from '@/components/ui/MoneyText';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SkeletonDetailPage } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useInvalidateDealData } from '@/hooks/use-deal-mutation';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import {
  cancelCampaign,
  getCampaign,
  getCampaignTracker,
  listApplications,
  reviewApplication,
  setCampaignStatus,
  type Campaign,
  type CampaignApplication,
} from '@/lib/api/campaigns';
import { getApiErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { contentTypeLabel } from '@/lib/constants';
import { campaignStatusMeta, dealStatusMeta } from '@/lib/deal-status';
import { formatMoney } from '@/lib/money';
import { CAMPAIGNS_QUERY_KEY } from '@/lib/query-keys';
import type { TrustScore } from '@/lib/theme';
import { toast } from '@/lib/toast';

const OPEN_DEAL = ['request_sent', 'accepted', 'payment_pending', 'active', 'post_submitted'];

/** Campaign Detail / Tracker (prompt.md §6.5). */
export default function BrandCampaignScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const invalidate = useInvalidateDealData();
  const { ask, sheet } = useConfirmSheet();

  const campaign = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'detail', id], queryFn: () => getCampaign(id) });
  const tracker = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'tracker', id], queryFn: () => getCampaignTracker(id) });
  useRefetchOnFocus(campaign.refetch);
  useRefetchOnFocus(tracker.refetch);

  const status = useMutation({
    mutationFn: (next: 'active' | 'paused') => setCampaignStatus(id, next),
    onSuccess: async (_d, next) => {
      await invalidate();
      toast.success(next === 'paused' ? 'Campaign paused' : 'Campaign resumed');
    },
    onError: (e) => toast.error('Could not update the campaign', getApiErrorMessage(e)),
  });
  const cancel = useMutation({
    mutationFn: () => cancelCampaign(id),
    onSuccess: async (r) => {
      await invalidate();
      toast.success(
        'Campaign cancelled',
        `${r.dealsCancelled} collab${r.dealsCancelled === 1 ? '' : 's'} closed${r.escrowRefunded ? `, ${r.escrowRefunded} escrow payment${r.escrowRefunded === 1 ? '' : 's'} refunded to you` : ''}.`,
      );
    },
    onError: (e) => toast.error('Could not cancel', getApiErrorMessage(e)),
  });

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
  const type = CAMPAIGN_TYPE_META[c.type];
  const TypeIcon = type.icon;
  const st = campaignStatusMeta(c.status);
  const creators = tracker.data?.creators ?? [];
  const live = !['completed', 'cancelled'].includes(c.status);
  const openDeals = creators.filter((x) => OPEN_DEAL.includes(x.status));
  const heldDeals = creators.filter((x) => ['active', 'post_submitted'].includes(x.status));
  const spent = Number(tracker.data?.summary.spentAmount ?? c.spentAmount);
  const budget = Number(c.totalBudget);

  return (
    <Screen scroll contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader title={c.campaignNumber} />

      <View className="gap-3">
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="flex-row items-center gap-1.5 rounded-full border border-border px-2.5 py-1">
            <TypeIcon size={12} strokeWidth={2} color={colors.text.secondary} />
            <Text variant="caption" weight="semibold" color="secondary">
              {type.label}
            </Text>
          </View>
          <StatusBadge label={st.label} tone={st.tone} />
        </View>
        <Text variant="h1">{c.name}</Text>
        <Text variant="bodySm" color="secondary">
          {contentTypeLabel(c.contentType)} · Posts by {dayjs(c.postingDeadline).format('D MMM YYYY')}
        </Text>
      </View>

      <View className="gap-2 rounded-md border border-border bg-surface p-4">
        <View className="flex-row items-baseline justify-between">
          <Text variant="bodySm" color="secondary">
            {c.type === 'OpenApplication' ? `${formatMoney(c.budgetPerCreator)} per creator` : 'Budget used'}
          </Text>
          <Text variant="bodySm" weight="semibold">
            {formatMoney(spent)} of {formatMoney(budget)}
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-base">
          <View className="h-full rounded-full bg-accent" style={{ width: `${budget > 0 ? Math.min(100, (spent / budget) * 100) : 0}%` }} />
        </View>
        <Text variant="caption" color="muted">
          Paid into escrow so far{Number(c.refundedAmount) > 0 ? ` · ${formatMoney(c.refundedAmount)} refunded to you` : ''}
        </Text>
      </View>

      {c.type === 'BrandInvite' ? (
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="h2">Creators</Text>
            <Text variant="caption" color="secondary">
              {creators.length} of {c.targetInfluencerCount}
            </Text>
          </View>
          {creators.length === 0 ? (
            <EmptyState icon={Users} title="No one invited yet" description="Invite creators to start. The campaign goes live with the first invite." />
          ) : (
            <View className="overflow-hidden rounded-md border border-border bg-surface">
              {creators.map((x, i) => {
                const s = dealStatusMeta(x.status);
                const name = x.creatorProfile.user.displayName ?? 'Creator';
                return (
                  <Pressable
                    key={x.id}
                    onPress={() => router.push({ pathname: '/brand/collab/[id]', params: { id: x.id } })}
                    accessibilityRole="button"
                    className={cn('flex-row items-center gap-3 px-4 py-3 active:bg-base', i > 0 && 'border-t border-border')}
                  >
                    <Avatar name={name} uri={x.creatorProfile.user.profilePhotoUrl} size="sm" />
                    <View className="flex-1 gap-0.5">
                      <Text variant="body" weight="semibold" numberOfLines={1}>
                        {name}
                      </Text>
                      <Text variant="caption" color="secondary">
                        {x.dealNumber} · {formatMoney(x.offeredAmount)}
                      </Text>
                    </View>
                    <StatusBadge label={s.label} tone={s.tone} />
                  </Pressable>
                );
              })}
            </View>
          )}
          {live && creators.length < c.targetInfluencerCount && (
            <Button size="lg" leftIcon={<UserPlus size={18} color={colors.text.inverse} />} onPress={() => router.push({ pathname: '/brand/campaign/invite', params: { id: c.id } })}>
              Invite creators
            </Button>
          )}
        </View>
      ) : (
        <ApplicationsSection campaign={c} />
      )}

      <BriefCard campaign={c} />

      {live && (
        <View className="gap-3">
          {c.status === 'active' && (
            <Button variant="secondary" loading={status.isPending} onPress={() => status.mutate('paused')}>
              Pause campaign
            </Button>
          )}
          {c.status === 'paused' && (
            <Button variant="secondary" loading={status.isPending} onPress={() => status.mutate('active')}>
              Resume campaign
            </Button>
          )}
          <Button
            variant="ghost"
            loading={cancel.isPending}
            onPress={() =>
              ask({
                title: 'Cancel this campaign?',
                description:
                  openDeals.length === 0
                    ? 'No collabs are in progress, so nothing else changes. This can’t be undone.'
                    : `${openDeals.length} open collab${openDeals.length === 1 ? '' : 's'} will be closed${heldDeals.length ? ` and ${heldDeals.length} escrow payment${heldDeals.length === 1 ? '' : 's'} refunded to you` : ''}. Completed collabs are not affected. This can’t be undone.`,
                confirmLabel: 'Cancel campaign',
                destructive: true,
                onConfirm: () => cancel.mutate(),
              })
            }
          >
            Cancel campaign
          </Button>
        </View>
      )}
      {sheet}
    </Screen>
  );
}

function ApplicationsSection({ campaign: c }: { campaign: Campaign }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDealData();
  const [tab, setTab] = useState<CampaignApplication['status']>('pending');
  const apps = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'applications', c.id], queryFn: () => listApplications(c.id) });
  useRefetchOnFocus(apps.refetch);
  const review = useMutation({
    mutationFn: ({ appId, action }: { appId: string; action: 'approve' | 'decline' }) => reviewApplication(c.id, appId, action),
    onSuccess: async (_d, { action }) => {
      await invalidate();
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
      toast.success(action === 'approve' ? 'Approved' : 'Declined', action === 'approve' ? 'A request was sent to the creator.' : undefined);
    },
    onError: (e) => toast.error('Could not update the application', getApiErrorMessage(e)),
  });

  const list = (apps.data ?? []).filter((a) => a.status === tab);
  const count = (s: CampaignApplication['status']) => (apps.data ?? []).filter((a) => a.status === s).length;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="h2">Applications</Text>
        <Text variant="caption" color="secondary">
          {c.usedSlots} of {c.maxCreators} spots filled
        </Text>
      </View>
      {c.applicationDeadline && c.status === 'active' && <CountdownChip until={c.applicationDeadline} label="Applications close" />}
      <SegmentedControl
        options={[
          { value: 'pending', label: `New (${count('pending')})` },
          { value: 'approved', label: `Approved (${count('approved')})` },
          { value: 'declined', label: `Declined (${count('declined')})` },
        ]}
        value={tab}
        onChange={setTab}
      />
      {list.length === 0 ? (
        <Text variant="bodySm" color="secondary" className="py-4 text-center">
          {tab === 'pending' ? 'No new applications. Eligible creators can apply until applications close.' : 'Nothing here yet.'}
        </Text>
      ) : (
        list.map((a) => {
          const name = a.creatorProfile.user.displayName ?? 'Creator';
          return (
            <View key={a.id} className="gap-3 rounded-md border border-border bg-surface p-4">
              <Pressable
                onPress={() => router.push({ pathname: '/brand/creator/[userId]', params: { userId: a.creatorProfile.user.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Open ${name}'s profile`}
                className="flex-row items-center gap-3 active:opacity-70"
              >
                <Avatar name={name} uri={a.creatorProfile.user.profilePhotoUrl} size="md" />
                <View className="flex-1 gap-1">
                  <Text variant="body" weight="semibold">
                    {name}
                  </Text>
                  <View className="flex-row flex-wrap items-center gap-2">
                    {a.creatorProfile.trustScore && <TrustBadge score={a.creatorProfile.trustScore as TrustScore} size="sm" />}
                    {a.creatorProfile.followerRange && (
                      <Text variant="caption" weight="semibold">
                        {FollowerRangeLabels[a.creatorProfile.followerRange as FollowerRange]}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
              <Text variant="caption" color="secondary">
                {a.creatorProfile.niches.map((n) => n.niche).join(' · ')}
              </Text>
              <View className="flex-row justify-between rounded-md bg-base px-3 py-2">
                <Text variant="bodySm">{a.package.title}</Text>
                <MoneyText amount={a.package.price} variant="bodySm" />
              </View>
              {a.pitchNote && <Text variant="bodySm">“{a.pitchNote}”</Text>}
              {a.status === 'pending' ? (
                <View className="flex-row gap-3">
                  <Button variant="secondary" className="flex-1" disabled={review.isPending} onPress={() => review.mutate({ appId: a.id, action: 'decline' })}>
                    Decline
                  </Button>
                  <Button className="flex-1" disabled={review.isPending} onPress={() => review.mutate({ appId: a.id, action: 'approve' })}>
                    Approve
                  </Button>
                </View>
              ) : a.deal ? (
                <Pressable onPress={() => router.push({ pathname: '/brand/collab/[id]', params: { id: a.deal!.id } })} accessibilityRole="link" className="flex-row items-center justify-between active:opacity-60">
                  <Text variant="bodySm" weight="semibold" color="accent">
                    Open {a.deal.dealNumber}
                  </Text>
                  <StatusBadge label={dealStatusMeta(a.deal.status).label} tone={dealStatusMeta(a.deal.status).tone} />
                </Pressable>
              ) : a.reviewNote ? (
                <Text variant="caption" color="secondary">
                  Note: {a.reviewNote}
                </Text>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

function BriefCard({ campaign: c }: { campaign: Campaign }) {
  const rows: [string, string][] = [
    ['Product', c.productDescription ?? ''],
    ['Niches', c.targetNiches.join(', ')],
    ['Languages', c.targetLanguages.join(', ')],
    ['Hashtags', c.hashtags.join(' ')],
    ['Minimum followers', c.minFollowerCount ? c.minFollowerCount.toLocaleString('en-IN') : ''],
    ['Minimum engagement', c.minEngagementRate ? `${Number(c.minEngagementRate)}%` : ''],
    ['Counter-offers', c.negotiationAllowed ? 'Allowed' : 'Not allowed'],
    ['Draft approval', c.requiresDraftApproval ? 'Required before posting' : 'Not required'],
    ...(c.type === 'OpenApplication' ? ([['Auto-accept', c.autoAccept ? 'On' : 'Off']] as [string, string][]) : []),
  ];
  return (
    <View className="gap-4 rounded-md border border-border bg-surface p-4">
      <Text variant="h3">Brief</Text>
      <Text variant="body">{c.brief}</Text>
      {rows
        .filter(([, v]) => v)
        .map(([label, value]) => (
          <View key={label} className="gap-0.5">
            <Text variant="caption" color="secondary">
              {label}
            </Text>
            <Text variant="bodySm">{value}</Text>
          </View>
        ))}
    </View>
  );
}
