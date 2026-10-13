import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CircleAlert, Package, Plus } from 'lucide-react-native';
import { FlatList, RefreshControl, View } from 'react-native';

import { PackageCard } from '@/components/domain/packages/PackageCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getApiErrorMessage } from '@/lib/api/client';
import { listMyPackages, updatePackage, type CreatorPackage } from '@/lib/api/creator';
import { CREATOR_PACKAGES_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';

/**
 * Packages List (prompt.md §6.4) — `GET /creators/me/packages`. The endpoint returns the whole
 * list (it is not paginated), so this is a plain query rather than an infinite one.
 *
 * There is no Delete here: the backend's `DELETE` only sets `isActive: false` and the package
 * stays in this list, so the honest control is the visible/hidden switch on each card.
 */
export default function CreatorPackagesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: CREATOR_PACKAGES_QUERY_KEY,
    queryFn: listMyPackages,
  });

  // Optimistic: the switch moves immediately and snaps back with a toast if the save fails.
  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updatePackage(id, { isActive }),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: CREATOR_PACKAGES_QUERY_KEY });
      const previous = queryClient.getQueryData<CreatorPackage[]>(CREATOR_PACKAGES_QUERY_KEY);
      queryClient.setQueryData<CreatorPackage[]>(CREATOR_PACKAGES_QUERY_KEY, (current) =>
        current?.map((p) => (p.id === id ? { ...p, isActive } : p)),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(CREATOR_PACKAGES_QUERY_KEY, context.previous);
      toast.error('Could not update package', getApiErrorMessage(err));
    },
  });

  const openForm = (id?: string) =>
    router.push(id ? { pathname: '/creator/package-form', params: { id } } : '/creator/package-form');

  return (
    <Screen contentClassName="px-0">
      <View className="px-6 pt-2">
        <ScreenHeader title="Packages" />
      </View>

      {isPending ? (
        <View className="gap-3 px-6 pt-4">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-36 w-full" radius={12} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load your packages"
          description={getApiErrorMessage(error, 'Check your connection and try again.')}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(pkg) => pkg.id}
          className="flex-1"
          contentContainerClassName="flex-grow gap-3 px-6 pb-6 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.text.muted} />
          }
          renderItem={({ item }) => (
            <PackageCard
              pkg={item}
              mode="manage"
              onEdit={() => openForm(item.id)}
              onToggleActive={(isActive) => toggleActive.mutate({ id: item.id, isActive })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Package}
              title="No packages yet"
              description="Brands can't book you until you add one."
            />
          }
        />
      )}

      {!isPending && !isError && (
        <View className="border-t border-border bg-base px-6 pb-4 pt-3">
          <Button size="lg" leftIcon={<Plus size={18} color={colors.text.inverse} />} onPress={() => openForm()}>
            Add Package
          </Button>
        </View>
      )}
    </Screen>
  );
}
