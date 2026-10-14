import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { Bell, CircleAlert, MessageCircle } from 'lucide-react-native';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonListRow } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useUnreadCounts } from '@/hooks/use-inbox-badge';
import { useRefetchOnFocus } from '@/hooks/use-refetch-on-focus';
import type { AccountType } from '@/lib/auth/types';
import { getApiErrorMessage } from '@/lib/api/client';
import { getConversations, type Conversation } from '@/lib/api/messages';
import { cn } from '@/lib/cn';
import { shortStamp } from '@/lib/dates';
import { MESSAGES_QUERY_KEY } from '@/lib/query-keys';

/**
 * Inbox (prompt.md §6.3 Conversations List): one row per collab chat, newest activity first.
 * Notifications sit one tap away in the header, with their own unread count.
 */
export function InboxScreen({ viewer }: { viewer: AccountType }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const unread = useUnreadCounts();
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: [...MESSAGES_QUERY_KEY, 'conversations'],
    queryFn: getConversations,
  });
  useRefetchOnFocus(refetch);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-base">
      <View className="flex-row items-center justify-between px-6 pb-3 pt-4">
        <Text variant="h1">Inbox</Text>
        <Pressable
          onPress={() => router.push(`/${viewer}/notifications` as Href)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Notifications${unread.notifications ? `, ${unread.notifications} unread` : ''}`}
          className="h-11 flex-row items-center gap-1.5 rounded-md px-2 active:bg-surface"
        >
          <Bell size={20} strokeWidth={1.75} color={colors.text.primary} />
          <Text variant="bodySm" weight="medium">
            Notifications
          </Text>
          {unread.notifications > 0 && (
            <View className="min-w-5 items-center rounded-full bg-action px-1.5">
              <Text variant="caption" weight="semibold" color="inverse">
                {unread.notifications}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {isPending ? (
        <View className="gap-3 px-6">
          {[0, 1, 2].map((i) => (
            <SkeletonListRow key={i} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load your messages"
          description={getApiErrorMessage(error)}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(c) => c.dealId}
          contentContainerClassName="flex-grow pb-10"
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.text.muted} />}
          renderItem={({ item, index }) => (
            <ConversationRow
              conversation={item}
              isFirst={index === 0}
              onPress={() => router.push({ pathname: `/${viewer}/chat/[dealId]`, params: { dealId: item.dealId } } as unknown as Href)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={MessageCircle}
              title="No conversations yet"
              description="Chats open automatically once a collab payment is locked in escrow."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function ConversationRow({ conversation: c, isFirst, onPress }: { conversation: Conversation; isFirst: boolean; onPress: () => void }) {
  const name = c.otherParty.displayName ?? 'Collab';
  const unread = c.unreadCount > 0;
  const preview = c.lastMessage
    ? `${c.lastMessage.isMine ? 'You: ' : ''}${c.lastMessage.content}`
    : 'No messages yet — say hello';
  const isPlaceholder = !c.lastMessage || c.lastMessage.content.startsWith('📎');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}${unread ? `, ${c.unreadCount} unread` : ''}`}
      className={cn('flex-row items-center gap-3 px-6 py-3 active:bg-surface', !isFirst && 'border-t border-border')}
    >
      <Avatar name={name} uri={c.otherParty.profilePhotoUrl} size="md" />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text variant="body" weight={unread ? 'semibold' : 'medium'} numberOfLines={1} className="flex-1">
            {name}
          </Text>
          {c.lastMessage && (
            <Text variant="caption" color={unread ? 'primary' : 'muted'}>
              {shortStamp(c.lastMessage.createdAt)}
            </Text>
          )}
        </View>
        <Text variant="caption" color="secondary" numberOfLines={1}>
          {c.dealNumber}
          {c.packageTitle ? ` · ${c.packageTitle}` : ''}
          {c.chatState === 'ARCHIVED' ? ' · Closed' : ''}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text
            variant="bodySm"
            color={unread ? 'primary' : 'secondary'}
            weight={unread ? 'medium' : 'regular'}
            numberOfLines={1}
            className={cn('flex-1', isPlaceholder && 'italic')}
          >
            {preview}
          </Text>
          {unread && (
            <View className="min-w-5 items-center rounded-full bg-action px-1.5">
              <Text variant="caption" weight="semibold" color="inverse">
                {c.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
