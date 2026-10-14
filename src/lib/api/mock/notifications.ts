import type { NotificationPage } from '@/lib/api/notifications';

import { db, paginate, persistDb } from './db';
import { tick } from './deal-helpers';
import { currentUser } from './session';

export function getNotifications(page: number, limit: number): NotificationPage {
  tick();
  const user = currentUser();
  const mine = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { items, pagination } = paginate(mine, page, limit);
  return {
    items: items.map(({ userId: _userId, ...n }) => ({ ...n, actionUrl: null })),
    pagination,
    unreadCount: mine.filter((n) => !n.isRead).length,
  };
}

export function markRead(id: string) {
  const user = currentUser();
  const n = db.notifications.find((x) => x.id === id && x.userId === user.id);
  if (n && !n.isRead) {
    n.isRead = true;
    persistDb();
  }
}

export function markAllRead() {
  const user = currentUser();
  db.notifications.filter((n) => n.userId === user.id).forEach((n) => (n.isRead = true));
  persistDb();
}
