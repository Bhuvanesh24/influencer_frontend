import { BottomSheetFlatList, BottomSheetTextInput, type BottomSheetModal } from '@gorhom/bottom-sheet';
import { Check, ChevronDown, Search } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppBottomSheet } from '@/components/ui/BottomSheet';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

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
        <Text variant="bodySm" weight="medium" color="secondary">
          {label}
        </Text>
      )}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className={cn(
          'min-h-12 flex-row items-center justify-between rounded-sm border bg-surface px-3 py-3',
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
    <View className="mx-4 mb-2 flex-row items-center gap-2 rounded-sm border border-border bg-base px-3 py-2.5">
      <Search size={16} color={colors.text.muted} />
      <BottomSheetTextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search"
        placeholderTextColor={colors.text.muted}
        style={{ flex: 1, color: colors.text.primary, fontSize: 15, padding: 0 }}
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

      <AppBottomSheet ref={sheetRef} snapPoints={['60%']}>
        {searchable && <SheetSearchInput value={query} onChange={setQuery} />}
        <BottomSheetFlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingBottom: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onChange(item.value);
                setQuery('');
                sheetRef.current?.dismiss();
              }}
              className="flex-row items-center justify-between px-5 py-3.5"
              accessibilityRole="button"
            >
              <Text variant="body">{item.label}</Text>
              {item.value === value && <Check size={18} color={colors.brand.primary} />}
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
  const sheetRef = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');
  const filtered = useFilteredOptions(options, searchable ? query : '');
  const atMax = max !== undefined && values.length >= max;

  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else if (!atMax) {
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

      <AppBottomSheet ref={sheetRef} snapPoints={['70%']}>
        <View className="flex-row items-center justify-between px-5 pb-2">
          {max !== undefined && (
            <Text variant="caption" color={atMax ? 'brand' : 'muted'}>
              {values.length}/{max} selected
            </Text>
          )}
        </View>
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
                className={cn('flex-row items-center justify-between px-5 py-3.5', isDisabled && 'opacity-40')}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: isDisabled }}
              >
                <Text variant="body">{item.label}</Text>
                {isSelected ? (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-brand">
                    <Check size={13} color="#FFFFFF" />
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
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            className="items-center rounded-md bg-brand py-3.5"
            accessibilityRole="button"
          >
            <Text weight="semibold" color="inverse">
              Done
            </Text>
          </Pressable>
        </View>
      </AppBottomSheet>
    </>
  );
}
