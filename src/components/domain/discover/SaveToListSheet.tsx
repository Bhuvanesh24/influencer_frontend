import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppBottomSheet, type AppBottomSheetRef } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getApiErrorMessage } from '@/lib/api/client';
import { addToSavedList, createSavedList, getSavedLists, removeFromSavedList } from '@/lib/api/discovery';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';
import { DISCOVERY_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';

export const SAVED_LISTS_QUERY_KEY = [...DISCOVERY_QUERY_KEY, 'saved-lists'] as const;

/** "Save to list" (prompt.md §6.5): tick the lists this creator belongs in, or start a new one. */
export const SaveToListSheet = forwardRef<AppBottomSheetRef, { creatorProfileId: string; creatorName: string }>(
  function SaveToListSheet({ creatorProfileId, creatorName }, ref) {
    const { colors } = useAppTheme();
    const queryClient = useQueryClient();
    const [newName, setNewName] = useState('');
    const lists = useQuery({ queryKey: SAVED_LISTS_QUERY_KEY, queryFn: getSavedLists });

    const refresh = () => queryClient.invalidateQueries({ queryKey: SAVED_LISTS_QUERY_KEY });
    const toggle = useMutation({
      mutationFn: ({ listId, inList }: { listId: string; inList: boolean }) =>
        inList ? removeFromSavedList(listId, creatorProfileId) : addToSavedList(listId, creatorProfileId),
      onSuccess: () => {
        haptics.selection();
        refresh();
      },
      onError: (e) => toast.error('Could not update the list', getApiErrorMessage(e)),
    });
    const create = useMutation({
      mutationFn: async () => {
        const { id } = await createSavedList(newName);
        await addToSavedList(id, creatorProfileId);
      },
      onSuccess: () => {
        toast.success('Saved', `${creatorName} added to “${newName.trim()}”.`);
        setNewName('');
        refresh();
      },
      onError: (e) => toast.error('Could not create the list', getApiErrorMessage(e)),
    });

    return (
      <AppBottomSheet ref={ref}>
        <View className="gap-4 px-5 pt-2">
          <Text variant="h3">Save {creatorName} to a list</Text>
          <View className="overflow-hidden rounded-md border border-border">
            {(lists.data ?? []).map((list, i) => {
              const inList = list.items.some((it) => it.creatorProfile.id === creatorProfileId);
              return (
                <Pressable
                  key={list.id}
                  onPress={() => toggle.mutate({ listId: list.id, inList })}
                  disabled={toggle.isPending}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: inList }}
                  className={cn('min-h-13 flex-row items-center gap-3 px-4 py-3 active:bg-base', i > 0 && 'border-t border-border')}
                >
                  <View
                    className={cn(
                      'h-6 w-6 items-center justify-center rounded-sm border',
                      inList ? 'border-accent bg-accent' : 'border-border bg-surface',
                    )}
                  >
                    {inList && <Check size={14} strokeWidth={3} color={colors.text.inverse} />}
                  </View>
                  <Text variant="body" className="flex-1">
                    {list.name}
                  </Text>
                  <Text variant="caption" color="muted">
                    {list._count.items}
                  </Text>
                </Pressable>
              );
            })}
            {lists.data?.length === 0 && (
              <Text variant="bodySm" color="secondary" className="px-4 py-3">
                No lists yet. Name one below to start.
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            <BottomSheetTextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="New list name"
              placeholderTextColor={colors.text.muted}
              maxLength={128}
              style={{
                flex: 1,
                minHeight: 48,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: 12,
                paddingHorizontal: 14,
                backgroundColor: colors.bg.surface,
                color: colors.text.primary,
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
              }}
            />
            <Button
              size="md"
              fullWidth={false}
              disabled={!newName.trim()}
              loading={create.isPending}
              leftIcon={<Plus size={16} color={newName.trim() ? colors.text.inverse : colors.text.disabled} />}
              onPress={() => create.mutate()}
              className="px-4"
            >
              Create
            </Button>
          </View>
        </View>
      </AppBottomSheet>
    );
  },
);
