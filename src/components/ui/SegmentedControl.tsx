import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label?: string;
  options: readonly SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  /** Wraps onto multiple rows instead of forcing a single scaled-down row — use for >3 options
   * or long labels (e.g. gender) so text never clips. */
  wrap?: boolean;
}

/** Icon-grid / pill selector for a small fixed set of mutually-exclusive options. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  wrap = false,
}: SegmentedControlProps<T>) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text variant="bodySm" weight="medium" color="secondary">
          {label}
        </Text>
      )}
      <View className={cn('flex-row gap-2', wrap && 'flex-wrap')}>
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className={cn(
                'items-center justify-center rounded-sm border px-3 py-2.5',
                wrap ? '' : 'flex-1',
                isSelected ? 'border-brand bg-brand/10' : 'border-border bg-surface',
              )}
            >
              <Text variant="bodySm" weight="medium" color={isSelected ? 'brand' : 'secondary'}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  );
}
