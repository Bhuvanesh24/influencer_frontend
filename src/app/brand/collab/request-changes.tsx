import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useDealMutation } from '@/hooks/use-deal-mutation';
import { requestDraftChanges } from '@/lib/api/collabs';

/** Draft Review → Request Changes (prompt.md §6.5): feedback the creator sees with the draft. */
export default function RequestChangesScreen() {
  const router = useRouter();
  const { id, draftId } = useLocalSearchParams<{ id: string; draftId: string }>();
  const [feedback, setFeedback] = useState('');
  const send = useDealMutation(() => requestDraftChanges(id, draftId, feedback.trim()), {
    success: 'Feedback sent',
    successBody: 'The creator will send a new draft.',
    onSuccess: () => router.back(),
  });

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">What should change?</Text>
        <Text variant="body" color="secondary">
          Be specific — the creator sees exactly this with their draft.
        </Text>
      </View>
      <Input
        label="Feedback"
        multiline
        maxLength={2000}
        showCharCount
        value={feedback}
        onChangeText={setFeedback}
        placeholder="e.g. Keep the product in frame for the first 3 seconds."
      />
      <Button size="lg" disabled={feedback.trim().length === 0} loading={send.isPending} onPress={() => send.mutate()}>
        Send feedback
      </Button>
    </Screen>
  );
}
