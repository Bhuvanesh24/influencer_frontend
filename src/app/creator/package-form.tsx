import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { PackageForm } from '@/components/domain/packages/PackageForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { getApiErrorMessage } from '@/lib/api/client';
import { createPackage, listMyPackages, updatePackage } from '@/lib/api/creator';
import type { ContentType } from '@/lib/constants';
import { CREATOR_DASHBOARD_QUERY_KEY, CREATOR_PACKAGES_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import type { PackageInput } from '@/lib/validation/creator-wizard';

/**
 * Create / Edit Package (prompt.md §6.4). A pushed screen rather than the bottom sheet the spec
 * sketches: the form has two text fields and a text area, and a full screen gets the app's
 * existing keyboard handling for free (see SPRINTS.md Deviations). `?id=` switches it to edit.
 */
export default function PackageFormScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  // Reads the same cached list the Packages screen shows; only fetches if opened cold.
  const { data: packages, isPending, isError, refetch } = useQuery({
    queryKey: CREATOR_PACKAGES_QUERY_KEY,
    queryFn: listMyPackages,
    enabled: isEditing,
  });
  const existing = isEditing ? packages?.find((p) => p.id === id) : undefined;

  const mutation = useMutation({
    mutationFn: (values: PackageInput) => {
      const input = {
        title: values.title.trim(),
        contentType: values.contentType as ContentType,
        quantity: values.quantity,
        price: Number(values.price),
        description: values.description ?? '',
      };
      return id
        ? updatePackage(id, input)
        : createPackage({ ...input, description: input.description || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREATOR_PACKAGES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREATOR_DASHBOARD_QUERY_KEY });
      toast.success(isEditing ? 'Package updated' : 'Package added');
      router.back();
    },
    onError: (error) =>
      toast.error(isEditing ? 'Could not update package' : 'Could not add package', getApiErrorMessage(error)),
  });

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-2">
      <ScreenHeader />

      <View className="gap-2">
        <Text variant="h1">{isEditing ? 'Edit package' : 'New package'}</Text>
        <Text variant="body" color="secondary">
          Brands book a package as it is described here, so be specific about what they get.
        </Text>
      </View>

      {isEditing && isPending ? (
        <View className="gap-5">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-13 w-full" radius={12} />
          ))}
        </View>
      ) : isEditing && (isError || !existing) ? (
        <EmptyState
          icon={CircleAlert}
          title={isError ? "Couldn't load this package" : 'This package no longer exists'}
          description={isError ? 'Check your connection and try again.' : 'Go back to see your current packages.'}
          actionLabel={isError ? 'Try again' : 'Back to packages'}
          onAction={isError ? () => refetch() : () => router.back()}
        />
      ) : (
        <PackageForm
          defaultValues={
            existing
              ? {
                  title: existing.title,
                  contentType: existing.contentType,
                  quantity: existing.quantity,
                  price: String(Math.round(Number(existing.price))),
                  description: existing.description ?? '',
                }
              : undefined
          }
          guidance={
            existing?.recommendedMin && existing.recommendedMax
              ? { min: existing.recommendedMin, max: existing.recommendedMax }
              : null
          }
          submitLabel={isEditing ? 'Save Changes' : 'Add Package'}
          isSubmitting={mutation.isPending}
          onSubmit={(values) => mutation.mutate(values)}
        />
      )}
    </Screen>
  );
}
