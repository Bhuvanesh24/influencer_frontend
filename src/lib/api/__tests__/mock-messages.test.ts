import { replaceDb } from '@/lib/api/mock/db';
import * as messages from '@/lib/api/mock/messages';
import * as notifications from '@/lib/api/mock/notifications';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDb } from '@/lib/api/mock/seed';
import { mockLogin } from '@/lib/api/mock/session';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const asBrand = () => mockLogin(DEMO_ACCOUNTS.brand.email, DEMO_PASSWORD);
const asCreator = () => mockLogin(DEMO_ACCOUNTS.creator.email, DEMO_PASSWORD);

beforeEach(() => replaceDb(seedDb()));

describe('mock messaging', () => {
  it('lists only chats whose escrow is paid', () => {
    asCreator();
    const ids = messages.getConversations().map((c) => c.dealId);
    expect(ids).toEqual(expect.arrayContaining(['deal-4', 'deal-5']));
    expect(ids).not.toContain('deal-1');
  });

  it('refuses to send on a locked or archived chat', () => {
    asCreator();
    expect(() => messages.sendMessage('deal-1', 'hi')).toThrow(/locked/);
    expect(() => messages.sendMessage('deal-6', 'hi')).toThrow(/archived/);
  });

  it('delivers a message to the other side and counts it unread until read', () => {
    asCreator();
    const sent = messages.sendMessage('deal-4', 'Reel goes live tomorrow.');

    asBrand();
    const convo = messages.getConversations().find((c) => c.dealId === 'deal-4')!;
    expect(convo.unreadCount).toBeGreaterThan(0);
    expect(convo.lastMessage).toMatchObject({ content: 'Reel goes live tomorrow.', isMine: false });
    messages.getConversation('deal-4').messages.forEach((m) => messages.markRead(m.id));
    expect(messages.getConversations().find((c) => c.dealId === 'deal-4')!.unreadCount).toBe(0);

    asCreator();
    const mine = messages.getConversation('deal-4').messages.find((m) => m.id === sent.id)!;
    expect(mine.readReceipt).toBe('read');
  });

  it('marks all notifications read', () => {
    asBrand();
    expect(notifications.getNotifications(1, 20).unreadCount).toBeGreaterThan(0);
    notifications.markAllRead();
    expect(notifications.getNotifications(1, 20).unreadCount).toBe(0);
  });
});
