import { apiClient } from '@/lib/api/client';
import type { Pagination } from '@/lib/api/collabs';
import * as mock from '@/lib/api/mock/messages';
import { IS_MOCK_API, mockDelay } from '@/lib/api/mock-mode';

/**
 * Deal chat — `/messages/*`, reconciled against influencer_backend's message service on
 * 2026-10-14. A chat exists only for a deal whose escrow is paid (`chatState` OPEN), and becomes
 * read-only (ARCHIVED) once the deal completes.
 */

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export type ReadReceipt = 'sent' | 'delivered' | 'read';

export interface Conversation {
  dealId: string;
  dealNumber: string;
  chatState: 'OPEN' | 'ARCHIVED';
  otherParty: { id: string; displayName: string | null; profilePhotoUrl: string | null };
  lastMessage: { id: string; content: string; createdAt: string; isMine: boolean; readReceipt: ReadReceipt } | null;
  unreadCount: number;
  /** Mock extra: the package title, for the row's subtitle. */
  packageTitle?: string | null;
}

export interface ChatMessage {
  id: string;
  dealId: string;
  senderId: string;
  receiverId: string;
  content: string;
  readReceipt: ReadReceipt;
  attachmentUrls: string[];
  attachmentMimeTypes: string[];
  createdAt: string;
  sender: { id: string; displayName: string | null; profilePhotoUrl: string | null };
}

export type ReportReason = 'harassment' | 'abuse' | 'off_platform';

export async function getConversations(): Promise<Conversation[]> {
  if (IS_MOCK_API) return mockDelay(mock.getConversations(), 300);
  const { data } = await apiClient.get<ApiEnvelope<Conversation[]>>('/messages/conversations');
  return data.data;
}

export async function getConversation(dealId: string, page = 1, limit = 100): Promise<{ messages: ChatMessage[]; pagination: Pagination }> {
  if (IS_MOCK_API) return mockDelay(mock.getConversation(dealId), 200);
  const { data } = await apiClient.get<ApiEnvelope<{ messages: ChatMessage[]; pagination: Pagination }>>(
    `/messages/conversations/${dealId}`,
    { params: { page, limit } },
  );
  return data.data;
}

export async function sendMessage(dealId: string, content: string): Promise<ChatMessage> {
  if (IS_MOCK_API) return mockDelay(mock.sendMessage(dealId, content), 200);
  const { data } = await apiClient.post<ApiEnvelope<ChatMessage>>('/messages', { dealId, content });
  return data.data;
}

/** Sends the text first, then attaches the file to it (the backend's documented order). */
export async function sendAttachment(dealId: string, localUri: string, caption: string): Promise<void> {
  const extension = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ['mp4', 'mov'].includes(extension)
    ? `video/${extension === 'mov' ? 'quicktime' : 'mp4'}`
    : extension === 'pdf'
      ? 'application/pdf'
      : `image/${extension === 'jpg' ? 'jpeg' : extension}`;
  const message = await sendMessage(dealId, caption || (mimeType.startsWith('video') ? '📎 Video' : '📎 Photo'));
  if (IS_MOCK_API) {
    await mockDelay(undefined, 300);
    mock.addAttachment(message.id, localUri, mimeType);
    return;
  }
  const formData = new FormData();
  formData.append('attachment', { uri: localUri, name: `attachment.${extension}`, type: mimeType } as unknown as Blob);
  await apiClient.post(`/messages/${message.id}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function markMessageRead(messageId: string): Promise<void> {
  if (IS_MOCK_API) {
    mock.markRead(messageId);
    return;
  }
  await apiClient.put(`/messages/${messageId}/read`);
}

export async function reportMessage(messageId: string, reason: ReportReason): Promise<void> {
  if (IS_MOCK_API) {
    await mockDelay(undefined);
    mock.reportMessage(messageId, reason);
    return;
  }
  await apiClient.post(`/messages/${messageId}/report`, { reason });
}
