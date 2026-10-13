import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption';
type Color = 'primary' | 'secondary' | 'muted' | 'accent' | 'danger' | 'positive' | 'inverse' | 'disabled';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
type Family = 'display' | 'body';

const variantMeta: Record<Variant, { size: string; family: Family; weight: Weight }> = {
  display: { size: 'text-display', family: 'display', weight: 'bold' },
  h1: { size: 'text-h1', family: 'display', weight: 'bold' },
  h2: { size: 'text-h2', family: 'display', weight: 'bold' },
  h3: { size: 'text-h3', family: 'display', weight: 'semibold' },
  body: { size: 'text-body', family: 'body', weight: 'regular' },
  bodySm: { size: 'text-body-sm', family: 'body', weight: 'regular' },
  caption: { size: 'text-caption', family: 'body', weight: 'medium' },
};

/**
 * Each weight is a separate font file, so "weight" means "which file of this variant's family" —
 * it must never switch a heading from Manrope to Inter. Manrope ships in two weights only, so
 * anything lighter than bold resolves to its semibold.
 */
const fontClasses: Record<Family, Record<Weight, string>> = {
  display: {
    regular: 'font-display-medium',
    medium: 'font-display-medium',
    semibold: 'font-display-medium',
    bold: 'font-display',
  },
  body: {
    regular: 'font-sans',
    medium: 'font-sans-medium',
    semibold: 'font-sans-semibold',
    bold: 'font-sans-bold',
  },
};

const colorClasses: Record<Color, string> = {
  primary: 'text-ink',
  secondary: 'text-ink-secondary',
  muted: 'text-ink-muted',
  accent: 'text-accent-strong',
  danger: 'text-danger',
  positive: 'text-money-positive',
  inverse: 'text-inverse',
  disabled: 'text-ink-disabled',
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: Color;
  weight?: Weight;
}

/** Base text primitive — every screen should use this instead of RN's `Text` directly. */
export function Text({ variant = 'body', color = 'primary', weight, className, ...props }: TextProps) {
  const meta = variantMeta[variant];
  return (
    <RNText
      className={cn(meta.size, fontClasses[meta.family][weight ?? meta.weight], colorClasses[color], className)}
      {...props}
    />
  );
}
