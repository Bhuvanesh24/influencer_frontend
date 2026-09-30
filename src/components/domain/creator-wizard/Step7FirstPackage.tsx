import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Minus, Plus } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { createPackage } from '@/lib/api/creator';
import { getApiErrorMessage } from '@/lib/api/client';
import { CONTENT_TYPES, type ContentType } from '@/lib/constants';
import { toast } from '@/lib/toast';
import { firstPackageStepSchema, type FirstPackageStepInput } from '@/lib/validation/creator-wizard';

export function Step7FirstPackage({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const { colors } = useAppTheme();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FirstPackageStepInput>({
    resolver: zodResolver(firstPackageStepSchema),
    defaultValues: { title: '', contentType: '', quantity: 1, price: '', description: '' },
  });

  const quantity = watch('quantity') || 1;

  const mutation = useMutation({
    mutationFn: (values: FirstPackageStepInput) =>
      createPackage({
        title: values.title,
        contentType: values.contentType as ContentType,
        quantity: values.quantity,
        price: Number(values.price),
        description: values.description || undefined,
      }),
    onSuccess: onNext,
    onError: (error) => toast.error('Could not create package', getApiErrorMessage(error)),
  });

  return (
    <View className="gap-5">
      <View className="gap-1">
        <Text variant="h1" weight="bold">
          Add your first package
        </Text>
        <Text variant="body" color="secondary">
          Start receiving requests — you can add more later.
        </Text>
      </View>

      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Package title"
            placeholder='e.g. "1 Instagram Reel"'
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.title?.message}
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
            onChange={onChange}
            error={errors.contentType?.message}
          />
        )}
      />

      <View className="gap-1.5">
        <Text variant="bodySm" weight="medium" color="secondary">
          Quantity
        </Text>
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => setValue('quantity', Math.max(1, quantity - 1))}
            className="h-10 w-10 items-center justify-center rounded-sm border border-border"
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
          >
            <Minus size={16} color={colors.text.primary} />
          </Pressable>
          <Text variant="h3" weight="semibold">
            {quantity}
          </Text>
          <Pressable
            onPress={() => setValue('quantity', quantity + 1)}
            className="h-10 w-10 items-center justify-center rounded-sm border border-border"
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

      <View className="gap-3">
        <Button size="lg" loading={mutation.isPending} onPress={handleSubmit((v) => mutation.mutate(v))}>
          Add Package & Finish
        </Button>
        <Button variant="ghost" onPress={onSkip}>
          Skip for now
        </Button>
      </View>
    </View>
  );
}
