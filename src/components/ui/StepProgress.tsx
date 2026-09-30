import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

/** Progress bar for multi-step wizards (prompt.md §6.2: "progress dots/bar at top"). */
export function StepProgress({ currentStep, totalSteps, label }: StepProgressProps) {
  return (
    <View className="gap-2">
      <View className="flex-row gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            className={cn('h-1.5 flex-1 rounded-full', i < currentStep ? 'bg-brand' : 'bg-border')}
          />
        ))}
      </View>
      <Text variant="caption" color="muted">
        {label ?? `Step ${currentStep} of ${totalSteps}`}
      </Text>
    </View>
  );
}
