import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

interface IconBadgeProps {
  icon: LucideIcon;
  size?: 'md' | 'lg';
  /** `positive` tints the glyph for a success moment; the ring itself stays neutral. */
  tone?: 'neutral' | 'positive';
  className?: string;
}

/**
 * The one treatment for a standalone "moment" icon — intro slides, success and empty states.
 * A hairline ring on a white surface with a thin ink glyph; a success moment swaps the ring for
 * the light-sage selected surface. No glow, no shadow.
 */
export function IconBadge({ icon: Icon, size = 'lg', tone = 'neutral', className }: IconBadgeProps) {
  const { colors } = useAppTheme();

  return (
    <View
      className={cn(
        'items-center justify-center rounded-full border',
        tone === 'positive' ? 'border-selected bg-selected' : 'border-border bg-surface',
        size === 'lg' ? 'h-16 w-16' : 'h-12 w-12',
        className,
      )}
    >
      <Icon
        size={size === 'lg' ? 26 : 20}
        strokeWidth={1.5}
        color={tone === 'positive' ? colors.money.positive : colors.text.primary}
      />
    </View>
  );
}
