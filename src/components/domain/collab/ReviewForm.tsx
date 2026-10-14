import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDealMutation } from '@/hooks/use-deal-mutation';
import { getDeal, submitReview } from '@/lib/api/collabs';
import type { AccountType } from '@/lib/auth/types';
import { counterpartName } from '@/lib/collab-view';
import { haptics } from '@/lib/haptics';
import { collabDetailKey } from '@/lib/query-keys';

const LABELS = ['', 'Poor', 'Below expectations', 'Good', 'Very good', 'Excellent'];

/** Review & Rating (prompt.md §6.3): 1–5 stars and an optional comment, once per side. */
export function ReviewForm({ dealId, viewer }: { dealId: string; viewer: AccountType }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { data: deal } = useQuery({ queryKey: collabDetailKey(dealId), queryFn: () => getDeal(dealId) });
  const name = deal ? counterpartName(deal, viewer) : '';

  const submit = useDealMutation(() => submitReview(dealId, { rating, comment: comment.trim() || undefined }), {
    success: 'Review posted',
    onSuccess: () => router.back(),
  });

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">{name ? `Rate ${name}` : 'Leave a review'}</Text>
        <Text variant="body" color="secondary">
          {viewer === 'brand'
            ? 'Your review appears on their public profile and helps other brands.'
            : 'Your review helps other creators know what working with this brand is like.'}
        </Text>
      </View>

      <View className="gap-3">
        <View className="flex-row justify-between" accessibilityRole="adjustable" accessibilityValue={{ min: 0, max: 5, now: rating }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => {
                haptics.selection();
                setRating(n);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
              className="h-14 w-14 items-center justify-center rounded-md active:bg-base"
            >
              <Star
                size={36}
                strokeWidth={1.5}
                color={n <= rating ? colors.money.held : colors.border.subtle}
                fill={n <= rating ? colors.money.held : 'transparent'}
              />
            </Pressable>
          ))}
        </View>
        <Text variant="bodySm" color="secondary" className="text-center">
          {rating > 0 ? LABELS[rating] : 'Tap a star'}
        </Text>
      </View>

      <Input
        label="Comment (optional)"
        multiline
        maxLength={1000}
        showCharCount
        value={comment}
        onChangeText={setComment}
        placeholder="What went well? What could be better?"
      />

      <Button size="lg" disabled={rating === 0} loading={submit.isPending} onPress={() => submit.mutate()}>
        Post review
      </Button>
    </Screen>
  );
}
