import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { CircleAlert, Send } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonListRow } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getMyApplications, type MyApplication } from '@/lib/api/campaigns';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';
import { CAMPAIGNS_QUERY_KEY } from '@/lib/query-keys';

const BADGE: Record<MyApplication['status'], { label: string; tone: 'info' | 'positive' | 'neutral' }> = {
  pending: { label: 'Waiting for the brand', tone: 'info' },
  approved: { label: 'Approved', tone: 'positive' },
  declined: { label: 'Not selected', tone: 'neutral' },
};

/** My Applications (prompt.md §6.4). Approved ones open the resulting collab. */
export default function MyApplicationsScreen() {
  const router = useRouter();
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: [...CAMPAIGNS_QUERY_KEY, 'mine'], queryFn: getMyApplications });
  useRefetchOnFocus(refetch);

  return (
    <Screen scroll contentClassName="gap-6 pb-10 pt-2">
      <ScreenHeader title="My applications" />
      {isPending ? (
        <View className="gap-3">
          <SkeletonListRow />
          <SkeletonListRow />
        </View>
      ) : isError ? (
        <EmptyState icon={CircleAlert} title="Couldn't load your applications" description={getApiErrorMessage(error)} actionLabel="Try again" onAction={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState icon={Send} title="No applications yet" description="Apply to open campaigns from the Campaigns tab." />
      ) : (
        <View className="gap-3">
          {data.map((a) => {
            const badge = BADGE[a.status];
            return (
              <Pressable
                key={a.id}
                onPress={() =>
                  a.deal
                    ? router.push({ pathname: '/creator/collab/[id]', params: { id: a.deal.id } })
                    : router.push({ pathname: '/creator/campaign/[id]', params: { id: a.campaign.id } })
                }
                accessibilityRole="button"
                className="gap-2 rounded-md border border-border bg-surface p-4 active:bg-base"
              >
                <Text variant="caption" color="secondary">
                  {a.campaign.brandProfile.companyName ?? 'A brand'} · applied {dayjs(a.appliedAt).format('D MMM')}
                </Text>
                <Text variant="h3">{a.campaign.name}</Text>
                <Text variant="bodySm" color="secondary">
                  With {a.package.title} · {formatMoney(a.campaign.budgetPerCreator ?? a.package.price)}
                </Text>
                <StatusBadge label={badge.label} tone={badge.tone} />
                {a.reviewNote && a.status === 'declined' && (
                  <Text variant="caption" color="secondary">
                    “{a.reviewNote}”
                  </Text>
                )}
                {a.deal && (
                  <Text variant="bodySm" weight="semibold" color="accent">
                    Open {a.deal.dealNumber}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
