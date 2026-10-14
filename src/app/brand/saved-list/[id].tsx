import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, Trash2, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { SAVED_LISTS_QUERY_KEY } from '@/components/domain/discover/SaveToListSheet';
import { Avatar } from '@/components/ui/Avatar';
import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getApiErrorMessage } from '@/lib/api/client';
import { deleteSavedList, getSavedLists, removeFromSavedList } from '@/lib/api/discovery';
import { toast } from '@/lib/toast';

/** Saved List Detail (prompt.md §6.5): the creators in one list, each removable. */
export default function SavedListDetailScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const { ask, sheet } = useConfirmSheet();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useQuery({ queryKey: SAVED_LISTS_QUERY_KEY, queryFn: getSavedLists });
  const list = data?.find((l) => l.id === id);

  const refresh = () => queryClient.invalidateQueries({ queryKey: SAVED_LISTS_QUERY_KEY });
  const remove = useMutation({
    mutationFn: (creatorProfileId: string) => removeFromSavedList(id, creatorProfileId),
    onSuccess: refresh,
    onError: (e) => toast.error('Could not remove', getApiErrorMessage(e)),
  });
  const del = useMutation({
    mutationFn: () => deleteSavedList(id),
    onSuccess: async () => {
      await refresh();
      toast.success('List deleted');
      router.back();
    },
    onError: (e) => toast.error('Could not delete the list', getApiErrorMessage(e)),
  });

  return (
    <Screen scroll contentClassName="gap-6 pb-10 pt-2">
      <ScreenHeader
        title={list?.name}
        right={
          list ? (
            <Pressable
              onPress={() =>
                ask({
                  title: `Delete “${list.name}”?`,
                  description: 'The creators stay on the platform; only this list goes.',
                  confirmLabel: 'Delete list',
                  destructive: true,
                  onConfirm: () => del.mutate(),
                })
              }
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Delete list"
              className="h-11 w-11 items-center justify-center rounded-md active:bg-surface"
            >
              <Trash2 size={20} color={colors.status.danger} />
            </Pressable>
          ) : undefined
        }
      />

      {list && list.items.length === 0 && (
        <EmptyState icon={Bookmark} title="This list is empty" description="Open a creator in Discover and tap the bookmark to add them." />
      )}

      <View className="gap-3">
        {list?.items.map(({ creatorProfile: c }) => {
          const name = c.user.displayName ?? 'Creator';
          return (
            <View key={c.id} className="flex-row items-center gap-3 rounded-md border border-border bg-surface p-3">
              <Pressable
                onPress={() => router.push({ pathname: '/brand/creator/[userId]', params: { userId: c.user.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Open ${name}`}
                className="flex-1 flex-row items-center gap-3 active:opacity-70"
              >
                <Avatar name={name} uri={c.user.profilePhotoUrl} size="md" showAvailability isAvailable={c.isAvailable} />
                <View className="flex-1 gap-0.5">
                  <Text variant="body" weight="semibold" numberOfLines={1}>
                    {name}
                  </Text>
                  <Text variant="caption" color="secondary" numberOfLines={1}>
                    {c.niches.map((n) => n.niche).join(' · ') || 'No niches yet'}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => remove.mutate(c.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${name} from this list`}
                className="h-11 w-11 items-center justify-center rounded-md active:bg-base"
              >
                <X size={18} color={colors.text.muted} />
              </Pressable>
            </View>
          );
        })}
      </View>
      {sheet}
    </Screen>
  );
}
