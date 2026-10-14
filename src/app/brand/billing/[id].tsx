import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyText } from '@/components/ui/MoneyText';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonDetailPage } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { getBillingTransaction } from '@/lib/api/billing';
import { getApiErrorMessage } from '@/lib/api/client';
import { contentTypeLabel } from '@/lib/constants';
import { formatMoney } from '@/lib/money';
import { escrowBadge } from '@/lib/payout-accounts';
import { WALLET_QUERY_KEY } from '@/lib/query-keys';

/** Transaction Detail (prompt.md §6.5): the full breakdown of one escrow payment. */
export default function BillingTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [...WALLET_QUERY_KEY, 'billing', id],
    queryFn: () => getBillingTransaction(id),
  });

  if (isPending) {
    return (
      <Screen contentClassName="pt-2">
        <ScreenHeader />
        <SkeletonDetailPage />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen contentClassName="pt-2">
        <ScreenHeader />
        <EmptyState icon={CircleAlert} title="Couldn't load this payment" description={getApiErrorMessage(error)} actionLabel="Try again" onAction={() => refetch()} />
      </Screen>
    );
  }

  const badge = escrowBadge(data.status);
  const rows: [string, string][] = [
    ['Collab price', formatMoney(data.offeredAmount)],
    ['Platform fee', formatMoney(data.brandSideFee)],
  ];
  const timeline: [string, string | null][] = [
    ['Paid into escrow', data.lockedAt],
    ['Released to the creator', data.releasedAt],
    ['Refunded to you', data.refundedAt],
  ];

  return (
    <Screen scroll contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader title="Payment" />
      <View className="gap-2">
        <MoneyText amount={data.amount} variant="display" />
        <StatusBadge label={badge.label} tone={badge.tone} />
      </View>

      <View className="gap-3 rounded-md border border-border bg-surface p-4">
        {rows.map(([label, value]) => (
          <View key={label} className="flex-row justify-between">
            <Text variant="bodySm" color="secondary">
              {label}
            </Text>
            <Text variant="bodySm">{value}</Text>
          </View>
        ))}
        <View className="h-px bg-border" />
        <View className="flex-row justify-between">
          <Text variant="body" weight="semibold">
            Total paid
          </Text>
          <Text variant="body" weight="semibold">
            {formatMoney(data.amount)}
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <Text variant="h3">History</Text>
        {timeline
          .filter(([, at]) => at)
          .map(([label, at]) => (
            <View key={label} className="flex-row justify-between">
              <Text variant="bodySm">{label}</Text>
              <Text variant="bodySm" color="secondary">
                {dayjs(at!).format('D MMM YYYY, h:mm a')}
              </Text>
            </View>
          ))}
      </View>

      <View className="gap-1">
        <Text variant="caption" color="secondary">
          Collab
        </Text>
        <Text variant="body">
          {data.deal.dealNumber} · {data.deal.creatorProfile.user.displayName ?? 'Creator'} · {contentTypeLabel(data.deal.contentType)}
        </Text>
        {data.paymentGatewayTxnId && (
          <Text variant="caption" color="muted">
            Reference {data.paymentGatewayTxnId}
          </Text>
        )}
      </View>

      <Button variant="secondary" onPress={() => router.push({ pathname: '/brand/collab/[id]', params: { id: data.deal.id } })}>
        Open the collab
      </Button>
    </Screen>
  );
}
