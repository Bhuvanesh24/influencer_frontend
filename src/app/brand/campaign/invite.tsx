import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Check, SearchX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { FollowerRangeLabels, TrustBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonCardGrid } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useInvalidateDealData } from '@/hooks/use-deal-mutation';
import { getCampaign, getCampaignTracker, inviteCreators } from '@/lib/api/campaigns';
import { getApiErrorMessage } from '@/lib/api/client';
import { getCreatorPublicProfile, listCreators, type CreatorCardData } from '@/lib/api/discovery';
import { formatMoney } from '@/lib/money';
import { CAMPAIGNS_QUERY_KEY, DISCOVERY_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';

/**
 * Invite Creators (prompt.md §6.5): Discover scoped to one Brand-Invite campaign. Each creator gets
 * an Invite action (pick their package, set the offer); anyone already invited is disabled here,
 * not only rejected by the server.
 */
export default function InviteCreatorsScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaign = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'detail', id], queryFn: () => getCampaign(id) });
  const tracker = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'tracker', id], queryFn: () => getCampaignTracker(id) });
  const [matchOnly, setMatchOnly] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const niches = campaign.data?.targetNiches ?? [];
  const filters = { sort: 'collabs' as const, isAvailable: true, niche: matchOnly && niches.length ? niches : undefined };
  const creators = useInfiniteQuery({
    queryKey: [...DISCOVERY_QUERY_KEY, 'invite', id, filters],
    queryFn: ({ pageParam }) => listCreators(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
    enabled: !!campaign.data,
  });

  const invited = useMemo(
    () =>
      new Set(
        (tracker.data?.creators ?? [])
          .filter((c) => !['rejected', 'expired'].includes(c.status))
          .map((c) => c.creatorProfile.id),
      ),
    [tracker.data],
  );
  const slotsLeft = campaign.data ? campaign.data.targetInfluencerCount - invited.size : 0;
  const items = creators.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <View className="gap-3 px-6 pb-3">
        <ScreenHeader title="Invite creators" />
        <Text variant="bodySm" color="secondary">
          {campaign.data ? `${campaign.data.name} · ${slotsLeft} spot${slotsLeft === 1 ? '' : 's'} left` : ' '}
        </Text>
        {niches.length > 0 && (
          <View className="flex-row items-center justify-between">
            <Text variant="bodySm">Only {niches.join(', ')}</Text>
            <Switch value={matchOnly} onValueChange={setMatchOnly} trackColor={{ true: colors.accent.primary }} accessibilityLabel="Only matching niches" />
          </View>
        )}
      </View>
      {creators.isPending ? (
        <View className="px-6">
          <SkeletonCardGrid count={2} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerClassName="flex-grow gap-3 px-6 pb-10"
          keyboardShouldPersistTaps="handled"
          onEndReached={() => creators.hasNextPage && !creators.isFetchingNextPage && creators.fetchNextPage()}
          renderItem={({ item }) => (
            <InviteRow
              creator={item}
              campaignId={id}
              alreadyInvited={invited.has(item.id)}
              noSlots={slotsLeft <= 0}
              expanded={open === item.id}
              onToggle={() => setOpen(open === item.id ? null : item.id)}
              onInvited={() => {
                setOpen(null);
                tracker.refetch();
              }}
            />
          )}
          ListEmptyComponent={<EmptyState icon={SearchX} title="No available creators match" description="Turn off the niche filter to see everyone available." />}
          ListFooterComponent={creators.isFetchingNextPage ? <ActivityIndicator color={colors.text.muted} className="py-4" /> : null}
        />
      )}
    </SafeAreaView>
  );
}

function InviteRow({
  creator,
  campaignId,
  alreadyInvited,
  noSlots,
  expanded,
  onToggle,
  onInvited,
}: {
  creator: CreatorCardData;
  campaignId: string;
  alreadyInvited: boolean;
  noSlots: boolean;
  expanded: boolean;
  onToggle: () => void;
  onInvited: () => void;
}) {
  const { colors } = useAppTheme();
  const invalidate = useInvalidateDealData();
  const name = creator.displayName ?? 'Creator';
  const profile = useQuery({
    queryKey: [...DISCOVERY_QUERY_KEY, 'creator', creator.userId],
    queryFn: () => getCreatorPublicProfile(creator.userId),
    enabled: expanded,
  });
  const [packageId, setPackageId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const pkg = profile.data?.packages.find((p) => p.id === packageId);

  const invite = useMutation({
    mutationFn: () => inviteCreators(campaignId, [{ creatorProfileId: creator.id, packageId: packageId!, offeredAmount: amount ? Number(amount) : undefined }]),
    onSuccess: async () => {
      await invalidate();
      toast.success('Invite sent', `${name} has 72 hours to respond.`);
      onInvited();
    },
    onError: (e) => toast.error('Could not invite', getApiErrorMessage(e)),
  });

  return (
    <View className="gap-3 rounded-md border border-border bg-surface p-4">
      <View className="flex-row items-center gap-3">
        <Avatar name={name} uri={creator.profilePhotoUrl} size="md" />
        <View className="flex-1 gap-1">
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {name}
          </Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <TrustBadge score={creator.trustScore} size="sm" />
            {creator.followerRange && (
              <Text variant="caption" weight="semibold">
                {FollowerRangeLabels[creator.followerRange]}
              </Text>
            )}
          </View>
          <Text variant="caption" color="secondary" numberOfLines={1}>
            {creator.niches.slice(0, 3).join(' · ')}
            {creator.startingPrice ? ` · from ${formatMoney(creator.startingPrice)}` : ''}
          </Text>
        </View>
        {alreadyInvited ? (
          <View className="flex-row items-center gap-1">
            <Check size={14} color={colors.accent.primary} />
            <Text variant="caption" weight="semibold" color="accent">
              Invited
            </Text>
          </View>
        ) : (
          <Button size="sm" variant={expanded ? 'ghost' : 'secondary'} fullWidth={false} disabled={noSlots} onPress={onToggle} className="px-4">
            {expanded ? 'Close' : 'Invite'}
          </Button>
        )}
      </View>

      {expanded && !alreadyInvited && (
        <View className="gap-3 border-t border-border pt-3">
          <Text variant="bodySm" weight="medium">
            Which package?
          </Text>
          {profile.isPending ? (
            <ActivityIndicator color={colors.text.muted} />
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {(profile.data?.packages ?? []).map((p) => (
                <Chip
                  key={p.id}
                  label={`${p.title} · ${formatMoney(p.price)}`}
                  selectable
                  selected={packageId === p.id}
                  onPress={() => {
                    setPackageId(p.id);
                    setAmount(String(Math.round(Number(p.price))));
                  }}
                />
              ))}
            </View>
          )}
          {pkg && (
            <Input
              label="Your offer"
              keyboardType="number-pad"
              leftIcon={<Text color="muted">₹</Text>}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
              helperText={`Listed at ${formatMoney(pkg.price)}.`}
            />
          )}
          <Button disabled={!pkg || !(Number(amount) > 0)} loading={invite.isPending} onPress={() => invite.mutate()}>
            Send invite
          </Button>
        </View>
      )}
    </View>
  );
}
