import { BottomSheetFlatList, BottomSheetTextInput, type BottomSheetModal } from '@gorhom/bottom-sheet';
import { Check, ChevronDown, Search } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';

import { AppBottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';
import { haptics } from '@/lib/haptics';
import { Typography } from '@/lib/theme';

export interface SelectOption {
  value: string;
  label: string;
}

interface FieldShellProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  onPress: () => void;
}

function FieldShell({ label, error, children, onPress }: FieldShellProps) {
  const { colors } = useAppTheme();
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
          onPress();
        }}
        accessibilityRole="button"
        className={cn(
          'min-h-12 flex-row items-center justify-between rounded-md border bg-surface px-3 py-3',
          error ? 'border-danger' : 'border-border',
        )}
      >
        <View className="flex-1">{children}</View>
        <ChevronDown size={18} color={colors.text.muted} />
      </Pressable>
      {error && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

function useFilteredOptions(options: SelectOption[], query: string) {
  return useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);
}

function SheetSearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors } = useAppTheme();
  return (
    <View className="mx-4 mb-2 min-h-11 flex-row items-center gap-2 rounded-md border border-border bg-base px-3 py-2">
      <Search size={16} color={colors.text.muted} />
      <BottomSheetTextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search"
        placeholderTextColor={colors.text.muted}
        style={{ flex: 1, color: colors.text.primary, fontFamily: Typography.body.fontFamily, fontSize: Typography.body.fontSize, padding: 0 }}
      />
    </View>
  );
}

interface SelectFieldProps {
  label?: string;
  placeholder?: string;
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  searchable?: boolean;
  error?: string;
}

/** Single-select — opens a bottom sheet with optional search, closes on pick (prompt.md §3.4). */
export function SelectField({ label, placeholder = 'Select', value, onChange, options, searchable, error }: SelectFieldProps) {
  const { colors } = useAppTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');
  const filtered = useFilteredOptions(options, searchable ? query : '');
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <FieldShell label={label} error={error} onPress={() => sheetRef.current?.present()}>
        <Text variant="body" color={selected ? 'primary' : 'muted'} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
      </FieldShell>

      <AppBottomSheet ref={sheetRef} snapPoints={['60%']} scrollable>
        {searchable && <SheetSearchInput value={query} onChange={setQuery} />}
        <BottomSheetFlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingBottom: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                haptics.selection();
                onChange(item.value);
                setQuery('');
                sheetRef.current?.dismiss();
              }}
              className="min-h-12 flex-row items-center justify-between gap-3 px-5 py-3 active:bg-base"
              accessibilityRole="button"
              accessibilityState={{ selected: item.value === value }}
            >
              <Text variant="body" className="flex-1">
                {item.label}
              </Text>
              {item.value === value && <Check size={18} color={colors.accent.primary} />}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text variant="bodySm" color="muted" className="px-5 py-6 text-center">
              No matches
            </Text>
          }
        />
      </AppBottomSheet>
    </>
  );
}

interface MultiSelectFieldProps {
  label?: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  searchable?: boolean;
  /** Hard cap on selections (e.g. niches, max 5 — prompt.md §6.2 step 3). */
  max?: number;
  error?: string;
}

/** Multi-select — bottom sheet + search, selected items render as removable chips (prompt.md §3.4). */
export function MultiSelectField({
  label,
  placeholder = 'Select',
  values,
  onChange,
  options,
  searchable,
  max,
  error,
}: MultiSelectFieldProps) {
  const { colors } = useAppTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');
  const filtered = useFilteredOptions(options, searchable ? query : '');
  const atMax = max !== undefined && values.length >= max;

  function toggle(value: string) {
    if (values.includes(value)) {
      haptics.selection();
      onChange(values.filter((v) => v !== value));
    } else if (!atMax) {
      haptics.selection();
      onChange([...values, value]);
    }
  }

  return (
    <>
      <FieldShell label={label} error={error} onPress={() => sheetRef.current?.present()}>
        <Text variant="body" color={values.length ? 'primary' : 'muted'} numberOfLines={1}>
          {values.length ? `${values.length} selected` : placeholder}
        </Text>
      </FieldShell>

      {values.length > 0 && (
        <View className="flex-row flex-wrap gap-2 pt-1">
          {values.map((v) => {
            const opt = options.find((o) => o.value === v);
            if (!opt) return null;
            return <Chip key={v} label={opt.label} onRemove={() => toggle(v)} />;
          })}
        </View>
      )}

      <AppBottomSheet ref={sheetRef} snapPoints={['70%']} scrollable>
        {max !== undefined && (
          <Text variant="caption" color={atMax ? 'accent' : 'muted'} className="px-5 pb-2">
            {values.length}/{max} selected
          </Text>
        )}
        {searchable && <SheetSearchInput value={query} onChange={setQuery} />}
        <BottomSheetFlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingBottom: 12 }}
          renderItem={({ item }) => {
            const isSelected = values.includes(item.value);
            const isDisabled = !isSelected && atMax;
            return (
              <Pressable
                onPress={() => toggle(item.value)}
                disabled={isDisabled}
                className={cn(
                  'min-h-12 flex-row items-center justify-between gap-3 px-5 py-3 active:bg-base',
                  isDisabled && 'opacity-40',
                )}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected, disabled: isDisabled }}
              >
                <Text variant="body" className="flex-1">
                  {item.label}
                </Text>
                {isSelected ? (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <Check size={13} color={colors.text.inverse} />
                  </View>
                ) : (
                  <View className="h-5 w-5 rounded-full border border-border" />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text variant="bodySm" color="muted" className="px-5 py-6 text-center">
              No matches
            </Text>
          }
        />
        <View className="px-5 pt-3">
          <Button onPress={() => sheetRef.current?.dismiss()}>Done</Button>
        </View>
      </AppBottomSheet>
    </>
  );
}
