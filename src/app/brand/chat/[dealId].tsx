import { useLocalSearchParams } from 'expo-router';

import { ChatThread } from '@/components/domain/inbox/ChatThread';

export default function BrandChatScreen() {
  const { dealId } = useLocalSearchParams<{ dealId: string }>();
  return <ChatThread dealId={dealId} viewer="brand" />;
}
