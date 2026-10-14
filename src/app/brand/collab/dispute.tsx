import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useDealMutation } from '@/hooks/use-deal-mutation';
import { raiseDispute } from '@/lib/api/collabs';

const CATEGORIES = ['Post not live', 'Wrong content', 'Brief not followed', 'Post removed early', 'Something else'] as const;

/** Dispute (prompt.md §6.3): brand-only, within 48 hours of the post being submitted. */
export default function DisputeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ask, sheet } = useConfirmSheet();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number] | null>(null);
  const [details, setDetails] = useState('');
  const [link, setLink] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const reason = [category, details.trim()].filter(Boolean).join(': ');
  const valid = !!category && details.trim().length >= 10;

  const send = useDealMutation(() => raiseDispute(id, { reason, evidenceUrls: links }), {
    success: 'Dispute raised',
    successBody: 'Trust & Safety will review it. The payment stays in escrow meanwhile.',
    onSuccess: () => router.back(),
  });

  function addLink() {
    const url = link.trim();
    if (!/^https?:\/\/\S+$/i.test(url) || links.includes(url)) return;
    setLinks((l) => [...l, url]);
    setLink('');
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">Raise a dispute</Text>
        <Text variant="body" color="secondary">
          The payment stays in escrow while Trust & Safety reviews what happened. Use this only if the post
          doesn&apos;t meet what was agreed.
        </Text>
      </View>

      <View className="gap-2">
        <Text variant="bodySm" weight="medium">
          What went wrong?
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c} selectable selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </View>

      <Input
        label="Details"
        multiline
        maxLength={2000}
        showCharCount
        value={details}
        onChangeText={setDetails}
        helperText="At least 10 characters."
        placeholder="Describe the problem so the reviewer can check it."
      />

      <View className="gap-2">
        <Input
          label="Evidence links (optional)"
          placeholder="https://…"
          autoCapitalize="none"
          keyboardType="url"
          value={link}
          onChangeText={setLink}
          onSubmitEditing={addLink}
          returnKeyType="done"
        />
        {links.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            {links.map((l) => (
              <Chip key={l} label={l.replace(/^https?:\/\//, '')} onRemove={() => setLinks((x) => x.filter((y) => y !== l))} />
            ))}
          </View>
        )}
        {link.trim() !== '' && (
          <Button variant="ghost" size="sm" fullWidth={false} className="self-start" onPress={addLink}>
            Add link
          </Button>
        )}
      </View>

      <Button
        size="lg"
        variant="danger"
        disabled={!valid}
        loading={send.isPending}
        onPress={() =>
          ask({
            title: 'Raise this dispute?',
            description: 'The creator is notified and the payment is frozen until Trust & Safety decides.',
            confirmLabel: 'Raise dispute',
            destructive: true,
            onConfirm: () => send.mutate(),
          })
        }
      >
        Raise dispute
      </Button>
      {sheet}
    </Screen>
  );
}
