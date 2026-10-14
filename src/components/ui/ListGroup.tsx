import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Children, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

/**
 * A titled group of rows on one card — the settings-style list used by the profile screens and
 * Settings. Rows are separated by hairlines; the group title sits above the card.
 */
export function ListGroup({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View className="gap-2">
      {title && (
        <Text variant="caption" color="secondary" className="px-1 uppercase tracking-wide">
          {title}
        </Text>
      )}
      <View className="overflow-hidden rounded-md border border-border bg-surface">
        {rows.map((row, i) => (
          <View key={i} className={cn(i > 0 && 'border-t border-border')}>
            {row}
          </View>
        ))}
      </View>
      {footer && (
        <Text variant="caption" color="muted" className="px-1">
          {footer}
        </Text>
      )}
    </View>
  );
}

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Shown before the chevron: a status word, a badge, a check. */
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  accessibilityLabel?: string;
}

export function ListRow({ title, subtitle, icon: Icon, trailing, onPress, destructive, accessibilityLabel }: ListRowProps) {
  const { colors } = useAppTheme();
  const content = (
    <>
      {Icon && <Icon size={20} strokeWidth={1.5} color={destructive ? colors.status.danger : colors.text.primary} />}
      <View className="flex-1 gap-0.5">
        <Text variant="body" weight="medium" color={destructive ? 'danger' : 'primary'}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodySm" color="secondary">
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {onPress && !destructive && <ChevronRight size={18} color={colors.text.muted} />}
    </>
  );

  if (!onPress) {
    return <View className="min-h-13 flex-row items-center gap-3 px-4 py-3">{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)}
      className="min-h-13 flex-row items-center gap-3 px-4 py-3 active:bg-base"
    >
      {content}
    </Pressable>
  );
}
