import { useQuery } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreatorPublicView } from '@/components/domain/discover/CreatorPublicView';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonDetailPage } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { getApiErrorMessage } from '@/lib/api/client';
import { getCreatorPublicProfile } from '@/lib/api/discovery';
import { useAuthStore } from '@/lib/auth/store';
import { DISCOVERY_QUERY_KEY } from '@/lib/query-keys';

/** "Preview as brands see it" (prompt.md §6.4): the public profile, read-only. */
export default function CreatorPreviewScreen() {
  const userId = useAuthStore((s) => s.user?.id) ?? '';
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [...DISCOVERY_QUERY_KEY, 'creator', userId],
    queryFn: () => getCreatorPublicProfile(userId),
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <View className="px-6">
        <ScreenHeader title="Preview" />
      </View>
      {isPending ? (
        <View className="px-6">
          <SkeletonDetailPage />
        </View>
      ) : isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load the preview"
          description={getApiErrorMessage(error)}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : (
        <ScrollView contentContainerClassName="gap-6 px-6 pb-12 pt-2">
          <View className="rounded-md bg-selected px-4 py-3">
            <Text variant="bodySm">This is your profile as brands see it in Discover.</Text>
          </View>
          <CreatorPublicView creator={data} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
