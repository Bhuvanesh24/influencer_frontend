import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption';
type Color = 'primary' | 'secondary' | 'muted' | 'brand' | 'danger' | 'positive' | 'inverse';

const variantClasses: Record<Variant, string> = {
  display: 'font-display text-display',
  h1: 'font-display text-h1',
  h2: 'font-display text-h2',
  h3: 'font-display-medium text-h3',
  body: 'font-sans text-body',
  bodySm: 'font-sans text-body-sm',
  caption: 'font-sans-medium text-caption',
};

const colorClasses: Record<Color, string> = {
  primary: 'text-ink',
  secondary: 'text-ink-secondary',
  muted: 'text-ink-muted',
  brand: 'text-brand',
  danger: 'text-danger',
  positive: 'text-money-positive',
  inverse: 'text-surface',
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: Color;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

const weightClasses: Record<NonNullable<TextProps['weight']>, string> = {
  regular: 'font-sans',
  medium: 'font-sans-medium',
  semibold: 'font-sans-semibold',
  bold: 'font-sans-bold',
};

/** Base text primitive — every screen should use this instead of RN's `Text` directly. */
export function Text({ variant = 'body', color = 'primary', weight, className, ...props }: TextProps) {
  return (
    <RNText
      className={cn(variantClasses[variant], colorClasses[color], weight && weightClasses[weight], className)}
      {...props}
    />
  );
}
