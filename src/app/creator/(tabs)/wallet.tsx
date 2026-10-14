import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { ChevronRight, CircleAlert, Info, Landmark, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge } from '@/components/ui/Badge';
import { MonthlyBarChart } from '@/components/ui/BarChart';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyText } from '@/components/ui/MoneyText';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getApiErrorMessage } from '@/lib/api/client';
import { getMonthlyEarnings, getPayouts, getWalletSummary, type Payout, type PayoutStatus } from '@/lib/api/wallet';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import { maskAccount, payoutBadge } from '@/lib/payout-accounts';
import { WALLET_QUERY_KEY } from '@/lib/query-keys';

type Filter = 'all' | PayoutStatus | 'on_hold';

/** Wallet (prompt.md §6.4): what has been paid out, what is on its way, and every payout. */
export default function CreatorWalletTab() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const [explain, setExplain] = useState(false);
  const [openPayout, setOpenPayout] = useState<string | null>(null);

  const summary = useQuery({ queryKey: [...WALLET_QUERY_KEY, 'summary'], queryFn: getWalletSummary });
  const monthly = useQuery({ queryKey: [...WALLET_QUERY_KEY, 'monthly'], queryFn: () => getMonthlyEarnings(6) });
  const serverStatus = filter === 'all' || filter === 'on_hold' ? undefined : filter;
  const payouts = useInfiniteQuery({
    queryKey: [...WALLET_QUERY_KEY, 'payouts', serverStatus ?? 'all'],
    queryFn: ({ pageParam }) => getPayouts(pageParam, serverStatus),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
  });
  useRefetchOnFocus(summary.refetch);
  useRefetchOnFocus(payouts.refetch);

  const items = (payouts.data?.pages.flatMap((p) => p.items) ?? []).filter((p) => filter !== 'on_hold' || p.isOnHold);
  const refreshing = summary.isRefetching || payouts.isRefetching;

  const s = summary.data;
  const header = (
    <View className="gap-6 pb-4">
      <Text variant="h1">Wallet</Text>

      {summary.isPending ? (
        <SkeletonBlock className="h-36 w-full" radius={12} />
      ) : summary.isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load your wallet"
          description={getApiErrorMessage(summary.error)}
          actionLabel="Try again"
          onAction={() => summary.refetch()}
        />
      ) : (
        <>
          <View className="gap-1 rounded-md border border-border bg-surface p-5">
            <Pressable
              onPress={() => setExplain((e) => !e)}
              accessibilityRole="button"
              accessibilityState={{ expanded: explain }}
              className="flex-row items-center gap-1.5 self-start"
              hitSlop={8}
            >
              <Text variant="caption" color="secondary">
                Paid out to you, lifetime
              </Text>
              <Info size={14} color={colors.text.muted} />
            </Pressable>
            <MoneyText amount={s!.totalEarned} variant="display" tone="positive" />
            <Text variant="caption" color="muted">
              {s!.totalCompletedPayouts} payout{s!.totalCompletedPayouts === 1 ? '' : 's'} · {formatMoney(s!.totalFeesPaid)} in platform fees
            </Text>
            {explain && (
              <Text variant="bodySm" color="secondary" className="pt-2">
                Only money that has reached your account counts here. Payouts that are queued or on their way
                show below until they land — usually within a day of the brand verifying your post.
              </Text>
            )}
          </View>

          <View className="flex-row gap-3">
            <SumTile label="Queued" amount={s!.pending.amount} count={s!.pending.count} active={filter === 'pending'} onPress={() => setFilter(filter === 'pending' ? 'all' : 'pending')} />
            <SumTile label="On its way" amount={s!.processing.amount} count={s!.processing.count} active={filter === 'processing'} onPress={() => setFilter(filter === 'processing' ? 'all' : 'processing')} />
            <SumTile label="On hold" amount={s!.onHold.amount} count={s!.onHold.count} active={filter === 'on_hold'} onPress={() => setFilter(filter === 'on_hold' ? 'all' : 'on_hold')} />
          </View>

          {monthly.data && (
            <View className="gap-3 rounded-md border border-border bg-surface p-4">
              <Text variant="body" weight="semibold">
                Paid out per month
              </Text>
              <MonthlyBarChart data={monthly.data} />
            </View>
          )}

          <Pressable
            onPress={() => router.push('/creator/payout-accounts')}
            accessibilityRole="button"
            className="flex-row items-center gap-3 rounded-md border border-border bg-surface p-4 active:bg-base"
          >
            <Landmark size={20} strokeWidth={1.5} color={colors.text.primary} />
            <View className="flex-1 gap-0.5">
              <Text variant="body" weight="medium">
                Payout accounts
              </Text>
              <Text variant="caption" color="secondary">
                {s!.primaryAccount ? `Paid to ${maskAccount(s!.primaryAccount)}` : 'Add an account to get paid'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.text.muted} />
          </Pressable>
        </>
      )}

      <View className="gap-3">
        <Text variant="h2">Payout history</Text>
        <View className="flex-row flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['completed', 'Paid'],
              ['processing', 'On its way'],
              ['pending', 'Queued'],
              ['failed', 'Failed'],
            ] as [Filter, string][]
          ).map(([value, label]) => (
            <Chip key={value} label={label} selectable selected={filter === value} onPress={() => setFilter(value)} />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
        contentContainerClassName="px-6 pb-10 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              summary.refetch();
              monthly.refetch();
              payouts.refetch();
            }}
            tintColor={colors.text.muted}
          />
        }
        onEndReached={() => payouts.hasNextPage && !payouts.isFetchingNextPage && payouts.fetchNextPage()}
        renderItem={({ item, index }) => (
          <PayoutRow
            payout={item}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            open={openPayout === item.id}
            onPress={() => setOpenPayout(openPayout === item.id ? null : item.id)}
            onOpenDeal={() => router.push({ pathname: '/creator/collab/[id]', params: { id: item.deal.id } })}
          />
        )}
        ListEmptyComponent={
          payouts.isPending ? (
            <SkeletonBlock className="h-20 w-full" radius={12} />
          ) : (
            <EmptyState
              icon={Wallet}
              title={filter === 'all' ? 'No payouts yet' : 'Nothing here'}
              description={
                filter === 'all'
                  ? 'You get paid when a brand verifies your post, or 48 hours after you submit it.'
                  : 'No payouts with this status.'
              }
            />
          )
        }
        ListFooterComponent={payouts.isFetchingNextPage ? <ActivityIndicator color={colors.text.muted} className="py-4" /> : null}
      />
    </SafeAreaView>
  );
}

function SumTile({ label, amount, count, active, onPress }: { label: string; amount: string; count: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}: ${formatMoney(amount)}, ${count} payouts. Filter the history`}
      className={cn('flex-1 gap-1 rounded-md border p-3 active:opacity-80', active ? 'border-accent bg-selected' : 'border-border bg-surface')}
    >
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <MoneyText amount={amount} variant="body" />
      <Text variant="caption" color="muted">
        {count} payout{count === 1 ? '' : 's'}
      </Text>
    </Pressable>
  );
}

function PayoutRow({
  payout: p,
  isFirst,
  isLast,
  open,
  onPress,
  onOpenDeal,
}: {
  payout: Payout;
  isFirst: boolean;
  isLast: boolean;
  open: boolean;
  onPress: () => void;
  onOpenDeal: () => void;
}) {
  const badge = payoutBadge(p);
  const brand = p.deal.brandProfile.companyName ?? 'A Brand';
  return (
    <View
      className={cn(
        'border-x border-border bg-surface',
        isFirst && 'rounded-t-md border-t',
        isLast && 'rounded-b-md border-b',
        !isFirst && 'border-t',
      )}
    >
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ expanded: open }} className="gap-2 p-4 active:bg-base">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {p.deal.package?.title ?? p.deal.dealNumber}
            </Text>
            <Text variant="caption" color="secondary" numberOfLines={1}>
              {brand} · {dayjs(p.createdAt).format('D MMM YYYY')}
            </Text>
          </View>
          <MoneyText amount={p.amount} variant="h3" tone={p.status === 'completed' ? 'positive' : 'neutral'} />
        </View>
        <StatusBadge label={badge.label} tone={badge.tone} />
      </Pressable>
      {open && (
        <View className="gap-2 border-t border-border p-4">
          <Line label="Collab price" value={formatMoney(p.offeredAmount)} />
          <Line label="Platform fee" value={`− ${formatMoney(p.creatorSideFee)}`} />
          <Line label="You receive" value={formatMoney(p.amount)} strong />
          {p.completedAt && <Line label="Reached your account" value={dayjs(p.completedAt).format('D MMM YYYY')} />}
          {p.holdReason && <Line label="Why it's on hold" value={p.holdReason} />}
          {p.failedReason && <Line label="Why it failed" value={p.failedReason} />}
          <Pressable onPress={onOpenDeal} accessibilityRole="link" className="self-start py-1 active:opacity-60" hitSlop={8}>
            <Text variant="bodySm" weight="semibold" color="accent">
              Open {p.deal.dealNumber}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text variant="bodySm" color="secondary">
        {label}
      </Text>
      <Text variant="bodySm" weight={strong ? 'semibold' : 'regular'} className="flex-1 text-right">
        {value}
      </Text>
    </View>
  );
}
