import { zodResolver } from '@hookform/resolvers/zod';
import { Minus, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { CONTENT_TYPES } from '@/lib/constants';
import { formatMoney } from '@/lib/money';
import { MAX_PACKAGE_QUANTITY, packageSchema, type PackageInput } from '@/lib/validation/creator-wizard';

export const EMPTY_PACKAGE_FORM: PackageInput = { title: '', contentType: '', quantity: 1, price: '', description: '' };

interface PackageFormProps {
  defaultValues?: PackageInput;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: PackageInput) => void;
  /** Server-provided price range for similar creators. Shown only when the backend supplied one. */
  guidance?: { min: string; max: string } | null;
  /** Rendered under the submit button — a Skip or Cancel action. */
  secondaryAction?: ReactNode;
}

/**
 * The package fields, shared by the creator wizard's last step and the Packages screen's
 * create/edit, so a package is always entered the same way. Owns its own form state; remount it
 * (change its `key`) to reset.
 */
export function PackageForm({
  defaultValues = EMPTY_PACKAGE_FORM,
  submitLabel,
  isSubmitting,
  onSubmit,
  guidance,
  secondaryAction,
}: PackageFormProps) {
  const { colors } = useAppTheme();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PackageInput>({
    resolver: zodResolver(packageSchema),
    defaultValues,
  });

  const quantity = watch('quantity') || 1;

  function stepQuantity(delta: number) {
    Keyboard.dismiss();
    setValue('quantity', Math.min(MAX_PACKAGE_QUANTITY, Math.max(1, quantity + delta)));
  }

  return (
    <View className="gap-5">
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Package title"
            placeholder='e.g. "Product review reel"'
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.title?.message}
            maxLength={255}
          />
        )}
      />

      <Controller
        control={control}
        name="contentType"
        render={({ field: { onChange, value } }) => (
          <SegmentedControl
            label="Content type"
            wrap
            options={CONTENT_TYPES.map((c) => ({ value: c.value, label: c.label }))}
            value={value || null}
            onChange={(v) => {
              Keyboard.dismiss();
              onChange(v);
            }}
            error={errors.contentType?.message}
          />
        )}
      />

      <View className="gap-1.5">
        <Text variant="bodySm" weight="medium">
          Quantity
        </Text>
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => stepQuantity(-1)}
            className="h-12 w-12 items-center justify-center rounded-md border border-border bg-surface active:bg-base"
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
          >
            <Minus size={16} color={colors.text.primary} />
          </Pressable>
          <Text variant="h3" className="min-w-6 text-center" accessibilityLabel={`Quantity ${quantity}`}>
            {quantity}
          </Text>
          <Pressable
            onPress={() => stepQuantity(1)}
            className="h-12 w-12 items-center justify-center rounded-md border border-border bg-surface active:bg-base"
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
          >
            <Plus size={16} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      <Controller
        control={control}
        name="price"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Price (₹)"
            placeholder="5000"
            keyboardType="number-pad"
            leftIcon={<Text color="muted">₹</Text>}
            value={value}
            onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
            onBlur={onBlur}
            error={errors.price?.message}
            helperText={
              guidance
                ? `Similar creators charge ${formatMoney(guidance.min)}–${formatMoney(guidance.max)} for this.`
                : undefined
            }
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Description (optional)"
            placeholder="What's included in this package?"
            multiline
            maxLength={1000}
            showCharCount
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />

      <View className="gap-2">
        <Button size="lg" loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
          {submitLabel}
        </Button>
        {secondaryAction}
      </View>
    </View>
  );
}
