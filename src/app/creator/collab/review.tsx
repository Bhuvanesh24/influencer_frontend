import { useLocalSearchParams } from 'expo-router';

import { ReviewForm } from '@/components/domain/collab/ReviewForm';

export default function CreatorReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReviewForm dealId={id} viewer="creator" />;
}
