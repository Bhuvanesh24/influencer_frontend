import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BarChart3, Bookmark, Building2, CircleAlert, Receipt, Settings } from 'lucide-react-native';
import { View } from 'react-native';

import { AccountSection } from '@/components/domain/account/AccountSection';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getBrandProfile } from '@/lib/api/brand';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { BRAND_PROFILE_QUERY_KEY } from '@/lib/query-keys';

/** The brand's own account screen (reached by tapping the logo on Home). */
export default function BrandAccountScreen() {
  const router = useRouter();
  const onboardingName = useAuthStore((s) => s.user?.displayName) ?? '';
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: BRAND_PROFILE_QUERY_KEY,
    queryFn: getBrandProfile,
  });
  useRefetchOnFocus(refetch);

  if (isPending) {
    return (
      <Screen contentClassName="gap-6 pt-2">
        <ScreenHeader />
        <SkeletonBlock className="h-16 w-full" radius={12} />
        <SkeletonBlock className="h-40 w-full" radius={12} />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen contentClassName="gap-6 pt-2">
        <ScreenHeader />
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load your account"
          description={getApiErrorMessage(error, 'Check your connection and try again.')}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </Screen>
    );
  }

  const name = data.companyName?.trim() || onboardingName || 'Your brand';
  const isSetUp = !!data.companyName && !!data.industry && !!data.phone;

  return (
    <Screen scroll contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader title="Account" />

      <View className="flex-row items-center gap-4">
        <Avatar name={name} uri={data.logoUrl} size="lg" />
        <View className="flex-1 gap-1">
          <Text variant="h2" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="bodySm" color="secondary" numberOfLines={1}>
            {data.industry ?? 'Industry not set'}
          </Text>
        </View>
      </View>

      <ListGroup title="Company">
        <ListRow
          icon={Building2}
          title="Company profile"
          subtitle={isSetUp ? 'Name, industry, contact details and GSTIN' : 'Not finished — creators see it with every request'}
          trailing={
            isSetUp ? undefined : (
              <Text variant="caption" weight="semibold" color="accent">
                Finish
              </Text>
            )
          }
          onPress={() => router.push('/brand/profile')}
        />
      </ListGroup>

      <ListGroup title="Money">
        <ListRow icon={Receipt} title="Billing" subtitle="Every escrow payment and where it is now" onPress={() => router.push('/brand/billing')} />
        <ListRow icon={BarChart3} title="Analytics" subtitle="Spend, results and top creators" onPress={() => router.push('/brand/analytics')} />
      </ListGroup>

      <ListGroup title="Creators">
        <ListRow
          icon={Bookmark}
          title="Saved lists"
          subtitle="Creators you shortlisted"
          onPress={() => router.push('/brand/saved-lists')}
        />
      </ListGroup>

      <ListGroup title="App">
        <ListRow icon={Settings} title="Settings" subtitle="Password, notifications and more" onPress={() => router.push('/brand/settings')} />
      </ListGroup>

      <AccountSection />
    </Screen>
  );
}
