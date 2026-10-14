import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BarChart3, CircleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { StatTile } from '@/components/domain/dashboard/DashboardParts';
import { Avatar } from '@/components/ui/Avatar';
import { MonthlyBarChart } from '@/components/ui/BarChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyText } from '@/components/ui/MoneyText';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonDetailPage } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getBrandAnalytics } from '@/lib/api/billing';
import { getApiErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { contentTypeLabel } from '@/lib/constants';
import { formatMoney } from '@/lib/money';
import { WALLET_QUERY_KEY } from '@/lib/query-keys';

/** Analytics (prompt.md §6.5): spend, the request funnel, top creators and where money went. */
export default function BrandAnalyticsScreen() {
  const router = useRouter();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [...WALLET_QUERY_KEY, 'analytics'],
    queryFn: getBrandAnalytics,
  });
  useRefetchOnFocus(refetch);

  if (isPending) {
    return (
      <Screen contentClassName="pt-2">
        <ScreenHeader title="Analytics" />
        <SkeletonDetailPage />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen contentClassName="pt-2">
        <ScreenHeader title="Analytics" />
        <EmptyState icon={CircleAlert} title="Couldn't load analytics" description={getApiErrorMessage(error)} actionLabel="Try again" onAction={() => refetch()} />
      </Screen>
    );
  }

  const s = data.summary;
  if (s.totalDeals === 0) {
    return (
      <Screen contentClassName="pt-2">
        <ScreenHeader title="Analytics" />
        <EmptyState icon={BarChart3} title="Nothing to measure yet" description="Send your first collab request and your spend and results will show here." />
      </Screen>
    );
  }

  const avgDeal = s.totalCollabs > 0 ? Number(s.totalSpend) / s.totalCollabs : 0;
  const nicheMax = Math.max(...(data.byNiche ?? []).map((n) => Number(n.amount)), 1);
  const funnel = [
    { label: 'Requests sent', value: data.funnel.sent },
    { label: 'Accepted', value: data.funnel.accepted },
    { label: 'Completed', value: data.funnel.completed },
  ];

  return (
    <Screen scroll contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader title="Analytics" />

      <View className="flex-row flex-wrap gap-3">
        <StatTile label="Total spend">
          <MoneyText amount={s.totalSpend} variant="h2" />
        </StatTile>
        <StatTile label="Avg collab value">
          <MoneyText amount={avgDeal} variant="h2" />
        </StatTile>
        <StatTile label="Collabs paid for">
          <Text variant="h2">{s.totalCollabs}</Text>
        </StatTile>
        <StatTile label="Completed">
          <Text variant="h2">{s.completedDeals}</Text>
        </StatTile>
      </View>

      <Section title="Spend per month" note="Completed collabs, including the platform fee.">
        <MonthlyBarChart data={data.monthlySpend} />
      </Section>

      <Section title="Request funnel" note={`${s.acceptanceRate}% of requests accepted · ${s.conversionRate}% completed`}>
        <View className="gap-3">
          {funnel.map((f) => (
            <View key={f.label} className="gap-1">
              <View className="flex-row justify-between">
                <Text variant="bodySm">{f.label}</Text>
                <Text variant="bodySm" weight="semibold">
                  {f.value}
                </Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-base">
                <View className="h-full rounded-full bg-accent" style={{ width: `${(f.value / Math.max(data.funnel.sent, 1)) * 100}%` }} />
              </View>
            </View>
          ))}
        </View>
      </Section>

      {(data.byNiche?.length ?? 0) > 0 && (
        <Section title="Spend by niche">
          <View className="gap-3">
            {data.byNiche!.map((n) => (
              <View key={n.niche} className="gap-1">
                <View className="flex-row justify-between">
                  <Text variant="bodySm">{n.niche}</Text>
                  <Text variant="bodySm" weight="semibold">
                    {formatMoney(n.amount)}
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-base">
                  <View className="h-full rounded-full bg-accent" style={{ width: `${(Number(n.amount) / nicheMax) * 100}%` }} />
                </View>
              </View>
            ))}
          </View>
        </Section>
      )}

      {data.byContentType.length > 0 && (
        <Section title="By content type">
          {data.byContentType.map((c, i) => (
            <View key={c.contentType} className={cn('flex-row justify-between py-2', i > 0 && 'border-t border-border')}>
              <Text variant="bodySm">{contentTypeLabel(c.contentType)}</Text>
              <Text variant="bodySm" color="secondary">
                {c.count} collab{c.count === 1 ? '' : 's'} · {formatMoney(c.totalAmount)}
              </Text>
            </View>
          ))}
        </Section>
      )}

      {data.topCreators.length > 0 && (
        <Section title="Top creators">
          {data.topCreators.map((c, i) => (
            <View key={c.creatorProfileId} className={cn('flex-row items-center gap-3 py-2', i > 0 && 'border-t border-border')}>
              <Avatar name={c.displayName ?? 'Creator'} uri={c.profilePhotoUrl} size="sm" />
              <View className="flex-1">
                <Text variant="bodySm" weight="semibold">
                  {c.displayName}
                </Text>
                <Text variant="caption" color="secondary">
                  {c.dealCount} collab{c.dealCount === 1 ? '' : 's'} · {c.niches.slice(0, 2).join(', ')}
                </Text>
              </View>
              <Text variant="bodySm" weight="semibold">
                {formatMoney(c.totalPaid)}
              </Text>
            </View>
          ))}
        </Section>
      )}

      <Pressable onPress={() => router.push('/brand/billing')} accessibilityRole="link" className="self-start py-2 active:opacity-60">
        <Text variant="bodySm" weight="semibold" color="accent">
          See every payment in Billing
        </Text>
      </Pressable>
    </Screen>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View className="gap-3 rounded-md border border-border bg-surface p-4">
      <View className="gap-0.5">
        <Text variant="body" weight="semibold">
          {title}
        </Text>
        {note && (
          <Text variant="caption" color="secondary">
            {note}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}
