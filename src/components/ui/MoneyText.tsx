import { Text, type TextProps } from '@/components/ui/Text';
import { formatMoney } from '@/lib/money';

interface MoneyTextProps extends Omit<TextProps, 'children' | 'color'> {
  amount: string | number | null | undefined;
  /** `positive` = released / earned, `held` = in escrow or pending. Both keep ink-level contrast. */
  tone?: 'neutral' | 'positive' | 'held';
}

/** The one way to render an amount (prompt.md §3.4). Amounts are never truncated or abbreviated. */
export function MoneyText({ amount, tone = 'neutral', variant = 'body', weight = 'semibold', style, ...props }: MoneyTextProps) {
  return (
    <Text
      // Equal-width digits, so amounts in a column line up.
      style={[{ fontVariant: ['tabular-nums'] }, style]}
      variant={variant}
      weight={weight}
      color={tone === 'positive' ? 'positive' : 'primary'}
      className={tone === 'held' ? 'text-money-held' : undefined}
      {...props}
    >
      {formatMoney(amount)}
    </Text>
  );
}
