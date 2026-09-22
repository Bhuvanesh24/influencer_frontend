import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { TrustScoreMeta, type TrustScore } from '@/lib/theme';

type Tone = 'neutral' | 'brand' | 'positive' | 'held' | 'danger' | 'info';

const toneClasses: Record<Tone, { bg: string; text: 'primary' | 'brand' | 'positive' | 'danger' | 'secondary' }> = {
  neutral: { bg: 'bg-base', text: 'secondary' },
  brand: { bg: 'bg-brand/10', text: 'brand' },
  positive: { bg: 'bg-money-positive/10', text: 'positive' },
  held: { bg: 'bg-money-held/15', text: 'primary' },
  danger: { bg: 'bg-danger/10', text: 'danger' },
  info: { bg: 'bg-info/10', text: 'brand' },
};

/** Generic pill badge. Screens that need a status→(tone,label) map should define their own — see
 * `lib/deal-status.ts` (added in the Collab Detail sprint) for the deal-status source of truth. */
export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const { bg, text } = toneClasses[tone];
  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', bg)}>
      <Text variant="caption" weight="semibold" color={text}>
        {label}
      </Text>
    </View>
  );
}

const trustDotClass: Record<TrustScore, string> = {
  high: 'bg-trust-high',
  medium: 'bg-trust-medium',
  low: 'bg-trust-low',
};

/** Trust Score badge — never render the word "unverified"; this replaced that model entirely. */
export function TrustBadge({
  score,
  size = 'md',
  onPress,
}: {
  score: TrustScore;
  size?: 'sm' | 'md';
  onPress?: () => void;
}) {
  const meta = TrustScoreMeta[score];
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      className="flex-row items-center gap-1.5 self-start"
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Trust score: ${meta.label}`}
    >
      <View className={cn('rounded-full', trustDotClass[score])} style={{ width: 8, height: 8 }} />
      <Text variant={size === 'sm' ? 'caption' : 'bodySm'} weight="medium" color="secondary">
        {meta.label}
      </Text>
    </Wrapper>
  );
}

export type FollowerRange =
  | 'under_1k'
  | 'range_1k_10k'
  | 'range_10k_50k'
  | 'range_50k_100k'
  | 'range_100k_500k'
  | 'range_500k_1m'
  | 'range_1m_plus';

export const FollowerRangeLabels: Record<FollowerRange, string> = {
  under_1k: 'Under 1K',
  range_1k_10k: '1K–10K',
  range_10k_50k: '10K–50K',
  range_50k_100k: '50K–100K',
  range_100k_500k: '100K–500K',
  range_500k_1m: '500K–1M',
  range_1m_plus: '1M+',
};

/** Follower counts are always shown as a range, never an exact number (prompt.md §1). */
export function FollowerRangeBadge({ range, platform }: { range: FollowerRange; platform?: 'instagram' | 'youtube' }) {
  return (
    <View className="flex-row items-center gap-1 self-start rounded-full bg-base px-2.5 py-1">
      <Text variant="caption" weight="semibold" color="secondary">
        {platform === 'youtube' ? 'YT ' : platform === 'instagram' ? 'IG ' : ''}
        {FollowerRangeLabels[range]}
      </Text>
    </View>
  );
}
