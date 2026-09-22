import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';

import { AppBottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

interface ConfirmOptions {
  title: string;
  /** One-sentence consequence description — never a bare "Are you sure?" (prompt.md §9). */
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Generic reusable confirmation sheet for every destructive/financial action — cancel campaign,
 * delete package, reject a request, raise a dispute, submit a post, remove a payout account.
 *
 * Usage: `const { ask, sheet } = useConfirmSheet(); ... ask({ title, description, onConfirm })`
 * and render `{sheet}` once near the root of the screen.
 */
export function useConfirmSheet() {
  const ref = useRef<BottomSheetModal>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const ask = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    ref.current?.present();
  }, []);

  const sheet = (
    <AppBottomSheet ref={ref}>
      {options && (
        <View className="gap-4 px-5 pt-2">
          <Text variant="h3" weight="semibold">
            {options.title}
          </Text>
          <Text variant="body" color="secondary">
            {options.description}
          </Text>
          <View className="flex-row gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onPress={() => ref.current?.dismiss()}>
              Cancel
            </Button>
            <Button
              variant={options.destructive ? 'danger' : 'primary'}
              className="flex-1"
              onPress={() => {
                ref.current?.dismiss();
                options.onConfirm();
              }}
            >
              {options.confirmLabel ?? 'Confirm'}
            </Button>
          </View>
        </View>
      )}
    </AppBottomSheet>
  );

  return { ask, sheet };
}
