import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useDealMutation } from '@/hooks/use-deal-mutation';
import { submitPerformanceReport } from '@/lib/api/collabs';

const FIELDS = [
  { key: 'views', label: 'Views' },
  { key: 'reach', label: 'Reach' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'shares', label: 'Shares' },
  { key: 'saves', label: 'Saves' },
] as const;

type Key = (typeof FIELDS)[number]['key'];

/** Performance Report (prompt.md §6.4): the post's numbers at 7 or 30 days, all optional. */
export default function PerformanceReportScreen() {
  const router = useRouter();
  const { id, type } = useLocalSearchParams<{ id: string; type: 'seven_day' | 'thirty_day' }>();
  const [values, setValues] = useState<Record<Key, string>>({
    views: '',
    reach: '',
    likes: '',
    comments: '',
    shares: '',
    saves: '',
  });
  const toNumber = (v: string) => (v === '' ? null : Number(v));
  const hasAny = Object.values(values).some((v) => v !== '');

  const submit = useDealMutation(
    () =>
      submitPerformanceReport(id, {
        reportType: type,
        views: toNumber(values.views),
        reach: toNumber(values.reach),
        likes: toNumber(values.likes),
        comments: toNumber(values.comments),
        shares: toNumber(values.shares),
        saves: toNumber(values.saves),
      }),
    { success: 'Results shared', onSuccess: () => router.back() },
  );

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">{type === 'thirty_day' ? '30-day results' : '7-day results'}</Text>
        <Text variant="body" color="secondary">
          Copy the numbers from your post insights. Fill in what you have — every field is optional.
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-4">
        {FIELDS.map((f) => (
          <View key={f.key} className="min-w-[45%] flex-1">
            <Input
              label={f.label}
              keyboardType="number-pad"
              value={values[f.key]}
              onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t.replace(/\D/g, '') }))}
            />
          </View>
        ))}
      </View>
      <Button size="lg" disabled={!hasAny} loading={submit.isPending} onPress={() => submit.mutate()}>
        Share results
      </Button>
    </Screen>
  );
}
