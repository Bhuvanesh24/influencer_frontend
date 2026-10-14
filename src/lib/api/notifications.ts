import { apiClient } from '@/lib/api/client';
import type { Page, Pagination } from '@/lib/api/collabs';
import * as mock from '@/lib/api/mock/notifications';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';

/** `/notifications` — reconciled against influencer_backend's notification controller (2026-10-14). */

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  dealId: string | null;
  campaignId: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage extends Page<AppNotification> {
  unreadCount: number;
}

export async function getNotifications(page = 1, limit = 20): Promise<NotificationPage> {
  if (IS_MOCK_API) return mockDelay(mock.getNotifications(page, limit), 300);
  const { data } = await apiClient.get<{ data: AppNotification[]; pagination: Pagination; unreadCount: number }>(
    '/notifications',
    { params: { page, limit } },
  );
  return { items: data.data, pagination: data.pagination, unreadCount: data.unreadCount };
}

export async function markNotificationRead(id: string): Promise<void> {
  if (IS_MOCK_API) {
    mock.markRead(id);
    return;
  }
  await apiClient.put(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined, 200);
    mock.markAllRead();
    return;
  }
  await apiClient.put('/notifications/read-all');
}
