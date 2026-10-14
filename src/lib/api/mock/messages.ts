import type { ChatMessage, Conversation, ReportReason } from '@/lib/api/messages';

import { db, MockApiError, nowIso, persistDb, uid, type MockMessage } from './db';
import { currentUser } from './session';

function partyCheck(dealId: string) {
  const user = currentUser();
  const deal = db.deals.find((d) => d.id === dealId);
  if (!deal) throw new MockApiError('Deal not found', 404);
  const brandUserId = db.brands.find((b) => b.id === deal.brandProfileId)?.userId;
  const creatorUserId = db.creators.find((c) => c.id === deal.creatorProfileId)?.userId;
  if (user.id !== brandUserId && user.id !== creatorUserId) {
    throw new MockApiError('You are not a party to this deal', 403);
  }
  return { user, deal, otherUserId: (user.id === brandUserId ? creatorUserId : brandUserId)! };
}

function toChatMessage(m: MockMessage): ChatMessage {
  const sender = db.users.find((u) => u.id === m.senderId);
  return {
    id: m.id,
    dealId: m.dealId,
    senderId: m.senderId,
    receiverId: m.receiverId,
    content: m.content,
    readReceipt: m.readReceipt,
    attachmentUrls: m.attachmentUrls ?? [],
    attachmentMimeTypes: m.attachmentMimeTypes ?? [],
    createdAt: m.createdAt,
    sender: { id: m.senderId, displayName: sender?.displayName ?? null, profilePhotoUrl: sender?.profilePhotoUrl ?? null },
  };
}

export function getConversations(): Conversation[] {
  const user = currentUser();
  return db.deals
    .filter((d) => d.chatState === 'OPEN' || d.chatState === 'ARCHIVED')
    .map((d) => {
      const brand = db.brands.find((b) => b.id === d.brandProfileId)!;
      const creator = db.creators.find((c) => c.id === d.creatorProfileId)!;
      if (user.id !== brand.userId && user.id !== creator.userId) return null;
      const otherId = user.id === brand.userId ? creator.userId : brand.userId;
      const other = db.users.find((u) => u.id === otherId);
      const messages = db.messages.filter((m) => m.dealId === d.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const last = messages[0];
      return {
        dealId: d.id,
        dealNumber: d.dealNumber,
        chatState: d.chatState as 'OPEN' | 'ARCHIVED',
        otherParty: { id: otherId, displayName: other?.displayName ?? null, profilePhotoUrl: other?.profilePhotoUrl ?? null },
        lastMessage: last
          ? { id: last.id, content: last.content, createdAt: last.createdAt, isMine: last.senderId === user.id, readReceipt: last.readReceipt }
          : null,
        unreadCount: messages.filter((m) => m.receiverId === user.id && m.readReceipt !== 'read').length,
        packageTitle: db.packages.find((p) => p.id === d.packageId)?.title ?? null,
        sortKey: last?.createdAt ?? d.updatedAt,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .map(({ sortKey: _sortKey, ...c }) => c);
}

export function getConversation(dealId: string) {
  const { user } = partyCheck(dealId);
  const messages = db.messages.filter((m) => m.dealId === dealId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let changed = false;
  for (const m of messages) {
    if (m.receiverId === user.id && m.readReceipt === 'sent') {
      m.readReceipt = 'delivered';
      changed = true;
    }
  }
  if (changed) persistDb();
  return {
    messages: messages.map(toChatMessage),
    pagination: { page: 1, limit: 100, total: messages.length, totalPages: 1 },
  };
}

export function sendMessage(dealId: string, content: string): ChatMessage {
  const { user, deal, otherUserId } = partyCheck(dealId);
  if (deal.chatState === 'LOCKED') throw new MockApiError('Chat is locked until the brand pays the escrow', 403);
  if (deal.chatState === 'ARCHIVED') throw new MockApiError('This conversation has been archived', 403);
  const text = content.trim();
  if (!text) throw new MockApiError('Message cannot be empty');
  if (text.length > 5000) throw new MockApiError('Message is too long (5000 characters max)');
  const message: MockMessage = {
    id: uid(),
    dealId,
    senderId: user.id,
    receiverId: otherUserId,
    content: text,
    readReceipt: 'sent',
    isReported: false,
    createdAt: nowIso(),
  };
  db.messages.push(message);
  persistDb();
  return toChatMessage(message);
}

export function addAttachment(messageId: string, url: string, mimeType: string) {
  const user = currentUser();
  const m = db.messages.find((x) => x.id === messageId);
  if (!m) throw new MockApiError('Message not found', 404);
  if (m.senderId !== user.id) throw new MockApiError('Cannot modify this message', 403);
  m.attachmentUrls = [...(m.attachmentUrls ?? []), url];
  m.attachmentMimeTypes = [...(m.attachmentMimeTypes ?? []), mimeType];
  persistDb();
}

export function markRead(messageId: string) {
  const user = currentUser();
  const m = db.messages.find((x) => x.id === messageId);
  if (!m || m.receiverId !== user.id) return;
  if (m.readReceipt !== 'read') {
    m.readReceipt = 'read';
    persistDb();
  }
}

export function reportMessage(messageId: string, _reason: ReportReason) {
  const user = currentUser();
  const m = db.messages.find((x) => x.id === messageId);
  if (!m) throw new MockApiError('Message not found', 404);
  if (m.senderId === user.id) throw new MockApiError('You cannot report your own message');
  if (m.receiverId !== user.id) throw new MockApiError('You cannot report this message', 403);
  m.isReported = true;
  persistDb();
}
