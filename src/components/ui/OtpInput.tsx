import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

/**
 * OTP entry (prompt.md §6.2 step 6): the boxes are display-only, and one real `TextInput` is
 * stretched invisibly over them. A single field is what lets the whole code arrive at once —
 * paste, iOS's SMS suggestion (`oneTimeCode`), Android's SMS autofill (`sms-otp`) — and gives
 * screen readers one labelled control instead of six. The text is transparent rather than the
 * input being `opacity: 0`, because iOS stops hit-testing views that are fully transparent.
 */
export function OtpInput({ length = 6, value, onChange, error }: OtpInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  // The box the next keystroke lands in; stays on the last box once the code is complete.
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View>
      <View
        className="flex-row justify-between gap-2"
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {digits.map((digit, i) => (
          <View
            key={i}
            className={cn(
              'min-h-14 flex-1 items-center justify-center rounded-md border bg-surface',
              error
                ? 'border-danger'
                : isFocused && i === activeIndex
                  ? 'border-ink'
                  : 'border-border',
            )}
          >
            <Text variant="h2">{digit}</Text>
          </View>
        ))}
      </View>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        importantForAutofill="yes"
        maxLength={length}
        caretHidden
        selectionColor="transparent"
        underlineColorAndroid="transparent"
        style={[StyleSheet.absoluteFill, { color: 'transparent' }]}
        accessibilityLabel={`${length}-digit verification code`}
        accessibilityValue={{ text: value.length ? value.split('').join(' ') : 'empty' }}
      />
    </View>
  );
}
