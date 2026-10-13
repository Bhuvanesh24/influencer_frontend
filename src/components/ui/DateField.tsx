import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Calendar } from 'lucide-react-native';
import { Keyboard, Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
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
  const { colors } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="gap-1.5">
      {label && (
        <Text variant="bodySm" weight="medium">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          setIsOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        className={cn(
          'min-h-13 flex-row items-center justify-between gap-2 rounded-md border bg-surface px-4 py-3',
          error ? 'border-danger' : isOpen ? 'border-ink' : 'border-border',
        )}
      >
        <Text variant="body" color={value ? 'primary' : 'muted'} className="flex-1">
          {value ? dayjs(value).format('D MMM YYYY') : placeholder}
        </Text>
        <Calendar size={18} color={colors.text.muted} />
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
            themeVariant="light"
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
            <Button onPress={() => setIsOpen(false)}>Done</Button>
          )}
        </View>
      )}
    </View>
  );
}
