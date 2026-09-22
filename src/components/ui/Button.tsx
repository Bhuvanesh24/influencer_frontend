import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/hooks/use-app-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 rounded-sm',
  md: 'h-12 px-4 rounded-md',
  lg: 'h-14 px-6 rounded-md',
};

const textVariant: Record<Size, 'bodySm' | 'body' | 'h3'> = {
  sm: 'bodySm',
  md: 'body',
  lg: 'h3',
};

const containerVariant: Record<Variant, string> = {
  primary: 'bg-brand active:bg-brand-press',
  secondary: 'bg-transparent border border-border active:bg-surface',
  ghost: 'bg-transparent active:opacity-60',
  danger: 'bg-danger active:opacity-90',
};

const disabledVariant: Record<Variant, string> = {
  primary: 'opacity-40',
  secondary: 'opacity-40',
  ghost: 'opacity-40',
  danger: 'opacity-40',
};

const textColorVariant: Record<Variant, 'inverse' | 'primary' | 'brand'> = {
  primary: 'inverse',
  secondary: 'primary',
  ghost: 'brand',
  danger: 'inverse',
};

/** Primary interactive control — every tappable call-to-action in the app should be a `Button`. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  fullWidth = true,
  className,
  ...props
}: ButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2',
        sizeClasses[size],
        containerVariant[variant],
        isDisabled && disabledVariant[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {/* Content stays rendered (opacity 0) while loading so the button's width never changes. */}
      <View className={cn('flex-row items-center gap-2', loading && 'opacity-0')}>
        {leftIcon}
        <Text variant={textVariant[size]} weight="semibold" color={textColorVariant[variant]}>
          {children}
        </Text>
      </View>
      {loading && (
        <ActivityIndicator
          className="absolute self-center"
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? colors.brand.primary : '#FFFFFF'}
        />
      )}
    </Pressable>
  );
}
