import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

interface DateFieldProps {
  label?: string;
  placeholder?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  error?: string;
  helperText?: string;
}

export function DateField({
  label,
  placeholder = 'Select date',
  value,
  onChange,
  maximumDate,
  minimumDate,
  error,
  helperText,
}: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="gap-1.5">
      {label && (
        <Text variant="bodySm" weight="medium" color="secondary">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        className={cn(
          'h-12 justify-center rounded-sm border bg-surface px-3',
          error ? 'border-danger' : 'border-border',
        )}
      >
        <Text variant="body" color={value ? 'primary' : 'muted'}>
          {value ? dayjs(value).format('D MMM YYYY') : placeholder}
        </Text>
      </Pressable>
      {(error || helperText) && (
        <Text variant="caption" color={error ? 'danger' : 'muted'}>
          {error ?? helperText}
        </Text>
      )}
      {isOpen && (
        <View className="gap-2 rounded-md border border-border bg-surface p-2">
          <DateTimePicker
            value={value ?? maximumDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') {
                setIsOpen(false);
              }
              if (event.type !== 'dismissed' && selectedDate) {
                onChange(selectedDate);
              }
            }}
          />
          {Platform.OS === 'ios' && (
            <Pressable onPress={() => setIsOpen(false)} className="items-center rounded-sm bg-brand py-2.5">
              <Text weight="semibold" color="inverse">
                Done
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
