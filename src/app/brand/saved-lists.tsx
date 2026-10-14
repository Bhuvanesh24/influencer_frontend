import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bookmark, CircleAlert, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { SAVED_LISTS_QUERY_KEY } from '@/components/domain/discover/SaveToListSheet';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonListRow } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import { getApiErrorMessage } from '@/lib/api/client';
import { createSavedList, getSavedLists } from '@/lib/api/discovery';
import { toast } from '@/lib/toast';

/** Saved Lists (prompt.md §6.5): named shortlists of creators. */
export default function SavedListsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: SAVED_LISTS_QUERY_KEY, queryFn: getSavedLists });
  useRefetchOnFocus(refetch);

  const create = useMutation({
    mutationFn: () => createSavedList(name),
    onSuccess: () => {
      toast.success('List created');
      setName('');
      setCreating(false);
      queryClient.invalidateQueries({ queryKey: SAVED_LISTS_QUERY_KEY });
    },
    onError: (e) => toast.error('Could not create the list', getApiErrorMessage(e)),
  });

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-6 pb-10 pt-2">
      <ScreenHeader
        title="Saved lists"
        right={
          <Pressable
            onPress={() => setCreating((c) => !c)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="New list"
            className="h-11 w-11 items-center justify-center rounded-md active:bg-surface"
          >
            <Plus size={22} color={colors.text.primary} />
          </Pressable>
        }
      />

      {creating && (
        <View className="gap-3 rounded-md border border-border bg-surface p-4">
          <Input label="List name" value={name} onChangeText={setName} maxLength={128} autoFocus placeholder="e.g. Diwali shortlist" />
          <Button disabled={!name.trim()} loading={create.isPending} onPress={() => create.mutate()}>
            Create list
          </Button>
        </View>
      )}

      {isPending ? (
        <View className="gap-3">
          {[0, 1, 2].map((i) => (
            <SkeletonListRow key={i} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load your lists"
          description={getApiErrorMessage(error)}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved lists yet"
          description="Save creators from their profile to shortlist them for later or for a campaign."
          actionLabel="New list"
          onAction={() => setCreating(true)}
        />
      ) : (
        <View className="gap-3">
          {data.map((list) => (
            <Pressable
              key={list.id}
              onPress={() => router.push({ pathname: '/brand/saved-list/[id]', params: { id: list.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${list.name}, ${list._count.items} creators`}
              className="flex-row items-center gap-3 rounded-md border border-border bg-surface p-4 active:bg-base"
            >
              <View className="flex-1 gap-1">
                <Text variant="body" weight="semibold">
                  {list.name}
                </Text>
                <Text variant="caption" color="secondary">
                  {list._count.items} creator{list._count.items === 1 ? '' : 's'}
                </Text>
              </View>
              <View className="flex-row">
                {list.items.slice(0, 3).map((it, i) => (
                  <View key={it.creatorProfile.id} className="rounded-full border-2 border-surface" style={{ marginLeft: i === 0 ? 0 : -10 }}>
                    <Avatar name={it.creatorProfile.user.displayName ?? '?'} uri={it.creatorProfile.user.profilePhotoUrl} size="sm" />
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
