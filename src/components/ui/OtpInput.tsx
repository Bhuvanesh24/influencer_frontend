import { useRef } from 'react';
import { TextInput, View } from 'react-native';

import { cn } from '@/lib/cn';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

/** 6-digit OTP boxes with auto-advance on type and auto-back on delete (prompt.md §6.2 step 6). */
export function OtpInput({ length = 6, value, onChange, error }: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  function setDigit(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join('').slice(0, length));

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  return (
    <View className="flex-row justify-between gap-2">
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(r) => {
            inputRefs.current[i] = r;
          }}
          value={digit}
          onChangeText={(t) => setDigit(i, t.replace(/\D/g, '').slice(-1))}
          onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          className={cn(
            'h-14 flex-1 rounded-sm border font-sans text-h2 text-ink',
            error ? 'border-danger' : digit ? 'border-brand' : 'border-border',
          )}
          accessibilityLabel={`Digit ${i + 1} of ${length}`}
        />
      ))}
    </View>
  );
}
