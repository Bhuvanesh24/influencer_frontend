import { X } from 'lucide-react-native';
import { Pressable, View, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

interface ChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  /** Selectable (filter/multi-select) chips toggle an active state; static ones are read-only. */
  selectable?: boolean;
  selected?: boolean;
  onRemove?: () => void;
}

// A chip is ~30pt tall; hitSlop brings a selectable one to a 44pt touch target.
const CHIP_HIT_SLOP = { top: 7, bottom: 7 };

/** Static tag or a `selectable` toggle chip — niche tags, filter pills, removable multi-select items. */
export function Chip({ label, selectable = false, selected = false, onRemove, className, ...props }: ChipProps) {
  const { colors } = useAppTheme();

  const content = (
    <View
      className={cn(
        'flex-row items-center gap-1.5 self-start rounded-full border px-3 py-1.5',
        selected ? 'border-accent bg-selected' : 'border-border bg-surface',
        className,
      )}
    >
      <Text variant="bodySm" weight="medium" color={selected ? 'primary' : 'secondary'}>
        {label}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={15} accessibilityRole="button" accessibilityLabel={`Remove ${label}`}>
          <X size={14} color={selected ? colors.text.primary : colors.text.secondary} />
        </Pressable>
      )}
    </View>
  );

  if (!selectable || onRemove) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={CHIP_HIT_SLOP}
      {...props}
    >
      {content}
    </Pressable>
  );
}
