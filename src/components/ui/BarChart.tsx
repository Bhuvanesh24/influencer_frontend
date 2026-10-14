import dayjs from 'dayjs';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';

interface MonthlyBarChartProps {
  /** `YYYY-MM` months, oldest first, amounts as Decimal strings. */
  data: { month: string; amount: string }[];
  height?: number;
}

/**
 * Single-series monthly money chart. One sage hue (the title names the series, so no legend),
 * thin bars with 4px rounded tops on a recessive baseline. Values aren't printed on every bar:
 * the latest month is shown by default and tapping a bar reads that month instead.
 */
export function MonthlyBarChart({ data, height = 140 }: MonthlyBarChartProps) {
  const [selected, setSelected] = useState(data.length - 1);
  const max = Math.max(...data.map((d) => Number(d.amount)), 1);
  const current = data[selected];

  return (
    <View className="gap-3">
      {current && (
        <View className="flex-row items-baseline gap-2">
          <Text variant="h3">{formatMoney(current.amount)}</Text>
          <Text variant="caption" color="secondary">
            {dayjs(`${current.month}-01`).format('MMMM YYYY')}
          </Text>
        </View>
      )}
      <View className="flex-row items-end gap-2 border-b border-border" style={{ height }}>
        {data.map((d, i) => {
          const value = Number(d.amount);
          const barHeight = value > 0 ? Math.max(4, (value / max) * (height - 8)) : 0;
          const isSelected = i === selected;
          return (
            <Pressable
              key={d.month}
              onPress={() => setSelected(i)}
              accessibilityRole="button"
              accessibilityLabel={`${dayjs(`${d.month}-01`).format('MMMM YYYY')}: ${formatMoney(d.amount)}`}
              accessibilityState={{ selected: isSelected }}
              // The hit area is the full column, much larger than the bar itself.
              className="h-full flex-1 items-center justify-end"
            >
              <View
                className={cn('w-full max-w-7 rounded-t-sm', isSelected ? 'bg-accent' : 'bg-accent/45')}
                style={{ height: barHeight, borderTopLeftRadius: 4, borderTopRightRadius: 4 }}
              />
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row gap-2">
        {data.map((d, i) => (
          <Text
            key={d.month}
            variant="caption"
            color={i === selected ? 'primary' : 'muted'}
            className="flex-1 text-center"
          >
            {dayjs(`${d.month}-01`).format('MMM')}
          </Text>
        ))}
      </View>
    </View>
  );
}
