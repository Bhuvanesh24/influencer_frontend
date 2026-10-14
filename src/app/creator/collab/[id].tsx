import { useLocalSearchParams } from 'expo-router';

import { CollabDetail } from '@/components/domain/collab/CollabDetail';

export default function CreatorCollabDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CollabDetail id={id} viewer="creator" />;
}
