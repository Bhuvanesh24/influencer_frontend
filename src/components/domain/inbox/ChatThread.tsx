import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, type Href } from 'expo-router';
import { ChevronRight, CircleAlert, ImagePlus, SendHorizontal } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomSheet, type AppBottomSheetRef } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonListRow } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { AccountType } from '@/lib/auth/types';
import { getApiErrorMessage } from '@/lib/api/client';
import { getDeal } from '@/lib/api/collabs';
import {
  getConversation,
  markMessageRead,
  reportMessage,
  sendAttachment,
  sendMessage,
  type ChatMessage,
  type ReportReason,
} from '@/lib/api/messages';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/cn';
import { counterpartName } from '@/lib/collab-view';
import { collabDetailKey, MESSAGES_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'harassment', label: 'Harassment', description: 'Insulting, threatening or unwanted behaviour' },
  { value: 'abuse', label: 'Abuse or hate', description: 'Abusive, hateful or explicit content' },
  { value: 'off_platform', label: 'Off-platform payment', description: 'Asking to pay or be paid outside FindCollab' },
];

/**
 * Chat Thread (prompt.md §6.3). Every chat belongs to a deal, so the header links back to it.
 * Polls for new messages while open; there is no push channel yet.
 */
export function ChatThread({ dealId, viewer }: { dealId: string; viewer: AccountType }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const reportRef = useRef<AppBottomSheetRef>(null);
  const [reporting, setReporting] = useState<ChatMessage | null>(null);
  const [text, setText] = useState('');
  const [viewing, setViewing] = useState<string | null>(null);

  const deal = useQuery({ queryKey: collabDetailKey(dealId), queryFn: () => getDeal(dealId) });
  const threadKey = [...MESSAGES_QUERY_KEY, 'thread', dealId];
  const thread = useQuery({
    queryKey: threadKey,
    queryFn: () => getConversation(dealId),
    refetchInterval: 5000,
  });

  const messages = useMemo(() => thread.data?.messages ?? [], [thread.data]);
  // Newest first for the inverted list.
  const reversed = useMemo(() => [...messages].reverse(), [messages]);
  const myLatest = reversed.find((m) => m.senderId === myId);

  // Mark what the other side sent as read, then refresh the unread counts.
  useEffect(() => {
    const unread = messages.filter((m) => m.receiverId === myId && m.readReceipt !== 'read');
    if (unread.length === 0) return;
    Promise.all(unread.map((m) => markMessageRead(m.id))).then(() =>
      queryClient.invalidateQueries({ queryKey: [...MESSAGES_QUERY_KEY, 'conversations'] }),
    );
  }, [messages, myId, queryClient]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEY });
  const send = useMutation({
    mutationFn: (content: string) => sendMessage(dealId, content),
    onMutate: () => setText(''),
    onSuccess: refresh,
    onError: (e, content) => {
      setText(content);
      toast.error('Message not sent', getApiErrorMessage(e));
    },
  });
  const attach = useMutation({
    mutationFn: (uri: string) => sendAttachment(dealId, uri, ''),
    onSuccess: refresh,
    onError: (e) => toast.error('Photo not sent', getApiErrorMessage(e)),
  });
  const report = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: ReportReason }) => reportMessage(id, reason),
    onSuccess: () => {
      reportRef.current?.dismiss();
      toast.success('Reported', 'Trust & Safety will review this message.');
    },
    onError: (e) => toast.error('Could not report', getApiErrorMessage(e)),
  });

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) attach.mutate(result.assets[0].uri);
  }

  const name = deal.data ? counterpartName(deal.data, viewer) : '';
  const archived = deal.data?.chatState === 'ARCHIVED';
  const locked = deal.data?.chatState === 'LOCKED';

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-base">
      <View className="border-b border-border px-6 pb-2">
        <ScreenHeader title={name} />
        {deal.data && (
          <Pressable
            onPress={() => router.push({ pathname: `/${viewer}/collab/[id]`, params: { id: dealId } } as unknown as Href)}
            accessibilityRole="link"
            accessibilityLabel="Open the collab"
            className="flex-row items-center gap-1 self-start rounded-full border border-border bg-surface px-3 py-1.5 active:bg-base"
          >
            <Text variant="caption" weight="semibold">
              {deal.data.dealNumber}
              {deal.data.package ? ` · ${deal.data.package.title}` : ''}
            </Text>
            <ChevronRight size={14} color={colors.text.muted} />
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {thread.isPending ? (
          <View className="gap-3 p-6">
            <SkeletonListRow />
            <SkeletonListRow />
          </View>
        ) : thread.isError ? (
          <EmptyState
            icon={CircleAlert}
            title="Couldn't load this chat"
            description={getApiErrorMessage(thread.error)}
            actionLabel="Try again"
            onAction={() => thread.refetch()}
          />
        ) : (
          <FlatList
            data={reversed}
            inverted
            keyExtractor={(m) => m.id}
            contentContainerClassName="gap-2 px-4 py-4"
            keyboardDismissMode="interactive"
            renderItem={({ item, index }) => {
              const mine = item.senderId === myId;
              const older = reversed[index + 1];
              const showDay = !older || !dayjs(older.createdAt).isSame(item.createdAt, 'day');
              return (
                <View>
                  {showDay && (
                    <Text variant="caption" color="muted" className="py-2 text-center">
                      {dayjs(item.createdAt).format('ddd, D MMM')}
                    </Text>
                  )}
                  <Bubble
                    message={item}
                    mine={mine}
                    receipt={mine && item.id === myLatest?.id ? item.readReceipt : undefined}
                    onImagePress={setViewing}
                    onLongPress={
                      mine
                        ? undefined
                        : () => {
                            setReporting(item);
                            reportRef.current?.present();
                          }
                    }
                  />
                </View>
              );
            }}
            ListEmptyComponent={
              <View className="items-center px-6 py-10" style={{ transform: [{ scaleY: -1 }] }}>
                <Text variant="bodySm" color="secondary" className="text-center">
                  Payment is secured in escrow. Use this chat to agree on the details with {name || 'the other side'}.
                </Text>
              </View>
            }
          />
        )}

        {archived || locked ? (
          <View className="border-t border-border bg-surface px-6 py-4">
            <Text variant="bodySm" color="secondary" className="text-center">
              {archived ? 'This collab is closed, so the chat is read-only.' : 'Chat opens once the payment is in escrow.'}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-end gap-2 border-t border-border bg-surface px-3 py-2">
            <Pressable
              onPress={pickImage}
              disabled={attach.isPending}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Send a photo"
              className="h-11 w-11 items-center justify-center rounded-md active:bg-base"
            >
              <ImagePlus size={22} strokeWidth={1.5} color={attach.isPending ? colors.text.muted : colors.text.secondary} />
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor={colors.text.muted}
              multiline
              maxLength={5000}
              keyboardAppearance="light"
              className="max-h-32 min-h-11 flex-1 rounded-md border border-border bg-base px-3 py-2.5 font-sans text-body text-ink"
              accessibilityLabel="Message"
            />
            <Pressable
              onPress={() => text.trim() && send.mutate(text.trim())}
              disabled={!text.trim() || send.isPending}
              accessibilityRole="button"
              accessibilityLabel="Send"
              className={cn('h-11 w-11 items-center justify-center rounded-md', text.trim() ? 'bg-action active:bg-action-press' : 'bg-border')}
            >
              <SendHorizontal size={20} color={text.trim() ? colors.text.inverse : colors.text.disabled} />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>

      <AppBottomSheet ref={reportRef} onDismiss={() => setReporting(null)}>
        <View className="gap-3 px-5 pt-2">
          <Text variant="h3">Report this message</Text>
          <Text variant="bodySm" color="secondary" numberOfLines={2}>
            “{reporting?.content}”
          </Text>
          {REPORT_REASONS.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => reporting && report.mutate({ id: reporting.id, reason: r.value })}
              disabled={report.isPending}
              accessibilityRole="button"
              className="gap-0.5 rounded-md border border-border bg-surface p-4 active:bg-base"
            >
              <Text variant="body" weight="medium">
                {r.label}
              </Text>
              <Text variant="caption" color="secondary">
                {r.description}
              </Text>
            </Pressable>
          ))}
          <Button variant="ghost" onPress={() => reportRef.current?.dismiss()}>
            Cancel
          </Button>
        </View>
      </AppBottomSheet>

      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable className="flex-1 items-center justify-center bg-black/90" onPress={() => setViewing(null)} accessibilityLabel="Close photo">
          {viewing && <Image source={{ uri: viewing }} style={{ width: '100%', height: '80%' }} contentFit="contain" />}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Bubble({
  message,
  mine,
  receipt,
  onLongPress,
  onImagePress,
}: {
  message: ChatMessage;
  mine: boolean;
  receipt?: ChatMessage['readReceipt'];
  onLongPress?: () => void;
  onImagePress: (uri: string) => void;
}) {
  const images = message.attachmentUrls.filter((_, i) => message.attachmentMimeTypes[i]?.startsWith('image'));
  const isPlaceholder = images.length > 0 && message.content.startsWith('📎');
  return (
    <View className={cn('max-w-[80%] gap-1', mine ? 'self-end items-end' : 'self-start items-start')}>
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={350}
        accessibilityHint={onLongPress ? 'Long press to report' : undefined}
        className={cn('gap-2 rounded-lg px-3.5 py-2.5', mine ? 'bg-action' : 'border border-border bg-surface')}
      >
        {images.map((uri) => (
          <Pressable key={uri} onPress={() => onImagePress(uri)} accessibilityRole="imagebutton" accessibilityLabel="Open photo">
            <Image source={{ uri }} style={{ width: 200, height: 200, borderRadius: 10 }} contentFit="cover" />
          </Pressable>
        ))}
        {!isPlaceholder && (
          <Text variant="body" color={mine ? 'inverse' : 'primary'}>
            {message.content}
          </Text>
        )}
      </Pressable>
      <Text variant="caption" color="muted">
        {dayjs(message.createdAt).format('h:mm a')}
        {receipt ? ` · ${receipt === 'read' ? 'Read' : receipt === 'delivered' ? 'Delivered' : 'Sent'}` : ''}
      </Text>
    </View>
  );
}
