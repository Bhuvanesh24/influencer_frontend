import { forwardRef } from 'react';
import { View } from 'react-native';

import { TrustBadge } from '@/components/ui/Badge';
import { AppBottomSheet, type AppBottomSheetRef } from '@/components/ui/BottomSheet';
import { Text } from '@/components/ui/Text';
import type { TrustScore } from '@/lib/theme';

const LEVELS: TrustScore[] = ['high', 'medium', 'low'];

/**
 * One-tap explanation of the Trust Score (prompt.md §8) — an unfamiliar mechanic that replaced
 * manual verification. Describes only what the spec states: it is computed automatically from
 * collaboration history and every creator starts at the middle level.
 */
export const TrustScoreSheet = forwardRef<AppBottomSheetRef, { score: TrustScore }>(function TrustScoreSheet(
  { score },
  ref,
) {
  return (
    <AppBottomSheet ref={ref}>
      <View className="gap-5 px-6 pt-2">
        <View className="gap-2">
          <Text variant="h2">Your Trust Score</Text>
          <Text variant="body" color="secondary">
            Brands see this next to your name. It is worked out automatically from how your
            collaborations go — you can&apos;t apply for it or pay for it. Every creator starts at
            Building Reputation.
          </Text>
        </View>
        <View className="rounded-md border border-border">
          {LEVELS.map((level, i) => (
            <View
              key={level}
              className={
                i === 0
                  ? 'min-h-12 flex-row items-center justify-between gap-3 px-4 py-3'
                  : 'min-h-12 flex-row items-center justify-between gap-3 border-t border-border px-4 py-3'
              }
            >
              <TrustBadge score={level} />
              {level === score && (
                <Text variant="caption" weight="semibold" color="accent">
                  You are here
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </AppBottomSheet>
  );
});
