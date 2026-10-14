import { useQuery } from '@tanstack/react-query';

import { getConversations } from '@/lib/api/messages';
import { getNotifications } from '@/lib/api/notifications';
import { MESSAGES_QUERY_KEY, NOTIFICATIONS_QUERY_KEY } from '@/lib/query-keys';

/**
 * Unread counts for the Inbox tab badge (prompt.md §4): unread notifications plus unread chat
 * messages. Polled, since nothing pushes these to the client yet.
 */
export function useUnreadCounts() {
  const conversations = useQuery({
    queryKey: [...MESSAGES_QUERY_KEY, 'conversations'],
    queryFn: getConversations,
    refetchInterval: 30_000,
  });
  const notifications = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, 'summary'],
    queryFn: () => getNotifications(1, 1),
    refetchInterval: 30_000,
  });
  const messages = (conversations.data ?? []).reduce((sum, c) => sum + c.unreadCount, 0);
  const alerts = notifications.data?.unreadCount ?? 0;
  return { messages, notifications: alerts, total: messages + alerts };
}
