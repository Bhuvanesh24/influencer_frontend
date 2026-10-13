import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useState, type ReactNode } from 'react';
import { Keyboard, Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  /** Renders a live "n/max" counter under the field — pass alongside `maxLength`. */
  showCharCount?: boolean;
  containerClassName?: string;
}

/** Text field — also serves as the TextArea by passing `multiline`. */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    showCharCount,
    maxLength,
    multiline,
    secureTextEntry,
    containerClassName,
    className,
    onFocus,
    onBlur,
    value,
    ...props
  },
  ref,
) {
  const { colors } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const isPasswordField = secureTextEntry !== undefined;
  const hasMessage = Boolean(error || helperText);
  const hasCounter = Boolean(showCharCount && maxLength);

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label && (
        <Text variant="bodySm" weight="medium">
          {label}
        </Text>
      )}
      <View
        className={cn(
          'flex-row items-center rounded-md border bg-surface px-4',
          multiline ? 'min-h-24 py-3' : 'min-h-13',
          error ? 'border-danger' : isFocused ? 'border-ink' : 'border-border',
        )}
      >
        {leftIcon && <View className="mr-2.5">{leftIcon}</View>}
        <TextInput
          ref={ref}
          className={cn(
            'flex-1 font-sans text-body text-ink',
            multiline && 'py-0',
            className,
          )}
          placeholderTextColor={colors.text.muted}
          keyboardAppearance="light"
          secureTextEntry={isPasswordField && !isSecureVisible}
          multiline={multiline}
          maxLength={maxLength}
          value={value}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            // Closes the keyboard the moment focus leaves a field — if another field is tapped
            // next, its own onFocus reopens it immediately, so this only ever removes the
            // keyboard when focus moves somewhere that doesn't need it (a button, a switch, or
            // just away from the form).
            Keyboard.dismiss();
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          {...props}
        />
        {isPasswordField && (
          <Pressable
            onPress={() => setIsSecureVisible((v) => !v)}
            hitSlop={13}
            accessibilityRole="button"
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
          >
            {isSecureVisible ? (
              <EyeOff size={18} color={colors.text.muted} />
            ) : (
              <Eye size={18} color={colors.text.muted} />
            )}
          </Pressable>
        )}
      </View>
      {(hasMessage || hasCounter) && (
        <View className="flex-row items-start justify-between gap-2">
          {hasMessage && (
            <Text
              variant="caption"
              color={error ? 'danger' : 'muted'}
              className="flex-1"
              accessibilityLiveRegion={error ? 'polite' : 'none'}
            >
              {error ?? helperText}
            </Text>
          )}
          {hasCounter && (
            <Text variant="caption" color="muted" className="ml-auto">
              {(typeof value === 'string' ? value.length : 0)}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
});
