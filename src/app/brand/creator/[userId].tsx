import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, BookmarkCheck, CircleAlert } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrustScoreSheet } from '@/components/domain/creator/TrustScoreSheet';
import { CreatorPublicView } from '@/components/domain/discover/CreatorPublicView';
import { SAVED_LISTS_QUERY_KEY, SaveToListSheet } from '@/components/domain/discover/SaveToListSheet';
import type { AppBottomSheetRef } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonDetailPage } from '@/components/ui/Skeleton';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getApiErrorMessage } from '@/lib/api/client';
import { getCreatorPublicProfile, getSavedLists } from '@/lib/api/discovery';
import { DISCOVERY_QUERY_KEY } from '@/lib/query-keys';

/** Creator Profile Detail, brand view (prompt.md §6.5). Route param is the creator's user id. */
export default function BrandCreatorProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const saveRef = useRef<AppBottomSheetRef>(null);
  const trustRef = useRef<AppBottomSheetRef>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [...DISCOVERY_QUERY_KEY, 'creator', userId],
    queryFn: () => getCreatorPublicProfile(userId),
  });
  const lists = useQuery({ queryKey: SAVED_LISTS_QUERY_KEY, queryFn: getSavedLists });
  const saved = !!data && !!lists.data?.some((l) => l.items.some((it) => it.creatorProfile.id === data.id));

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <View className="px-6">
        <ScreenHeader
          right={
            data ? (
              <Pressable
                onPress={() => saveRef.current?.present()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={saved ? 'Saved to a list. Change lists' : 'Save to a list'}
                className="h-11 w-11 items-center justify-center rounded-md active:bg-surface"
              >
                {saved ? (
                  <BookmarkCheck size={22} strokeWidth={1.75} color={colors.accent.primary} />
                ) : (
                  <Bookmark size={22} strokeWidth={1.75} color={colors.text.primary} />
                )}
              </Pressable>
            ) : undefined
          }
        />
      </View>
      {isPending ? (
        <View className="px-6">
          <SkeletonDetailPage />
        </View>
      ) : isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load this creator"
          description={getApiErrorMessage(error, 'Check your connection and try again.')}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : (
        <ScrollView contentContainerClassName="px-6 pb-12 pt-2">
          <CreatorPublicView
            creator={data}
            onTrustPress={() => trustRef.current?.present()}
            onRequestPackage={(packageId) =>
              router.push({ pathname: '/brand/request', params: { creatorUserId: data.userId, packageId } })
            }
          />
        </ScrollView>
      )}
      {data && <SaveToListSheet ref={saveRef} creatorProfileId={data.id} creatorName={data.displayName ?? 'this creator'} />}
      <TrustScoreSheet ref={trustRef} score={data?.trustScore ?? 'medium'} />
    </SafeAreaView>
  );
}
