import { useLocalSearchParams } from 'expo-router';

import { ReviewForm } from '@/components/domain/collab/ReviewForm';

export default function BrandReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReviewForm dealId={id} viewer="brand" />;
}
