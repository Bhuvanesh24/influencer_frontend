import dayjs from 'dayjs';
import { Clock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

/** "2d 4h left", "5h left", "12m left" — coarse on purpose; minutes only in the last hour. */
export function timeLeft(until: string, now = dayjs()): string {
  const minutes = dayjs(until).diff(now, 'minute');
  if (minutes <= 0) return 'Time is up';
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest > 0 && days < 3 ? `${days}d ${rest}h left` : `${days}d left`;
}

/**
 * Time-sensitive deadline chip (prompt.md §8 CountdownChip): accept-by, verify-by, post-by.
 * Turns to the danger tone inside the last 24 hours. Re-renders once a minute.
 */
export function CountdownChip({ until, label }: { until: string; label?: string }) {
  const { colors } = useAppTheme();
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(t);
  }, []);

  const urgent = dayjs(until).diff(now, 'hour') < 24;
  const text = timeLeft(until, now);
  return (
    <View
      className={cn('flex-row items-center gap-1 self-start rounded-full px-2.5 py-1', urgent ? 'bg-danger/10' : 'bg-base')}
      accessibilityLabel={label ? `${label}: ${text}` : text}
    >
      <Clock size={12} strokeWidth={2} color={urgent ? colors.status.danger : colors.text.secondary} />
      <Text variant="caption" weight="semibold" color={urgent ? 'danger' : 'secondary'}>
        {label ? `${label} · ${text}` : text}
      </Text>
    </View>
  );
}
