import { Check, X } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { passwordChecklist } from '@/lib/validation/auth';

/** Live checklist shown under the password field only while focused, not a blocking error (prompt.md §6.1). */
export function PasswordChecklist({ value }: { value: string }) {
  const { colors } = useAppTheme();

  return (
    <View className="gap-1 rounded-sm bg-base p-3">
      {passwordChecklist.map((rule) => {
        const passed = rule.test(value);
        return (
          <View key={rule.key} className="flex-row items-center gap-2">
            {passed ? (
              <Check size={14} color={colors.money.positive} />
            ) : (
              <X size={14} color={colors.text.muted} />
            )}
            <Text variant="caption" color={passed ? 'positive' : 'muted'}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
