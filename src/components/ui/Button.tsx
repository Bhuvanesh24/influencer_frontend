import { MotiView } from 'moti';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Motion } from '@/lib/motion';

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

// min-h (not h) so a label can wrap instead of clipping at larger system font sizes.
const sizeClasses: Record<Size, string> = {
  sm: 'min-h-9 px-3 py-1.5 rounded-sm',
  md: 'min-h-12 px-4 py-2 rounded-md',
  lg: 'min-h-13 px-6 py-3 rounded-md',
};

// Labels are always the body face — only the size steps up — so buttons read as one family.
const labelClasses: Record<Size, string> = {
  sm: 'text-body-sm',
  md: 'text-body',
  lg: 'text-body',
};

// `sm` is 36pt tall; hitSlop brings its touch target to 44pt without growing the visual.
const SM_HIT_SLOP = { top: 4, bottom: 4 };

const containerVariant: Record<Variant, string> = {
  primary: 'bg-action active:bg-action-press',
  secondary: 'bg-surface border border-border active:bg-base',
  ghost: 'bg-transparent active:opacity-60',
  danger: 'bg-danger active:opacity-90',
};

// A disabled primary button becomes a quiet stone fill rather than a faded dark slab. While
// loading, every variant keeps its normal look — only the spinner replaces the label.
const disabledVariant: Record<Variant, string> = {
  primary: 'bg-border',
  secondary: 'opacity-50',
  ghost: 'opacity-50',
  danger: 'opacity-40',
};

const textColorVariant: Record<Variant, 'inverse' | 'primary'> = {
  primary: 'inverse',
  secondary: 'primary',
  ghost: 'primary',
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
  const [isPressed, setIsPressed] = useState(false);
  // Spinner matches the label it replaces, in both themes.
  const spinnerColor =
    variant === 'secondary' || variant === 'ghost' ? colors.text.primary : colors.text.inverse;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={size === 'sm' ? SM_HIT_SLOP : undefined}
      className={cn(
        'flex-row items-center justify-center gap-2',
        sizeClasses[size],
        containerVariant[variant],
        disabled && disabledVariant[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
      onPressIn={(e) => {
        setIsPressed(true);
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setIsPressed(false);
        props.onPressOut?.(e);
      }}
    >
      <MotiView
        animate={{ scale: isPressed && !isDisabled ? Motion.pressScale : 1 }}
        transition={{ type: 'timing', duration: Motion.duration.press, easing: Motion.easing.out }}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 1 }}
      >
        {/* Content stays rendered (opacity 0) while loading so the button's width never changes. */}
        <MotiView
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ type: 'timing', duration: Motion.duration.press, easing: Motion.easing.out }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}
        >
          {leftIcon}
          <Text
            weight="semibold"
            color={disabled && variant === 'primary' ? 'muted' : textColorVariant[variant]}
            className={cn('shrink text-center', labelClasses[size])}
          >
            {children}
          </Text>
        </MotiView>
        {loading && (
          <ActivityIndicator
            className="absolute self-center"
            size="small"
            color={spinnerColor}
          />
        )}
      </MotiView>
    </Pressable>
  );
}
