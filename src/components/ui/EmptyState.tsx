import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  /** Always answer "why is this empty, and what do I do about it" — never a bare "No results." */
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-12">
      <View className="rounded-full bg-base p-4">
        <Icon size={28} color={colors.text.muted} />
      </View>
      <Text variant="h3" weight="semibold" className="text-center">
        {title}
      </Text>
      {description && (
        <Text variant="bodySm" color="secondary" className="text-center">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onPress={onAction} fullWidth={false} className="mt-2 px-6">
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
