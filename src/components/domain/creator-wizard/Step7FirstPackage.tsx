import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { createPackage } from '@/lib/api/creator';
import { getApiErrorMessage } from '@/lib/api/client';
import { useCreatorWizardStore, type WizardPackage } from '@/lib/auth/creator-wizard-store';
import { CONTENT_TYPES, type ContentType } from '@/lib/constants';
import { haptics } from '@/lib/haptics';
import { toast } from '@/lib/toast';
import { firstPackageStepSchema, type FirstPackageStepInput } from '@/lib/validation/creator-wizard';

const EMPTY_FORM: FirstPackageStepInput = { title: '', contentType: '', quantity: 1, price: '', description: '' };

function contentTypeLabel(value: ContentType): string {
  return CONTENT_TYPES.find((c) => c.value === value)?.label ?? value;
}

function PackageRow({ pkg, isFirst }: { pkg: WizardPackage; isFirst: boolean }) {
  return (
    <View className={isFirst ? 'flex-row items-start gap-3 py-3' : 'flex-row items-start gap-3 border-t border-border py-3'}>
      <View className="flex-1 gap-0.5">
        <Text variant="body" weight="semibold">
          {pkg.title}
        </Text>
        <Text variant="bodySm" color="secondary">
          {pkg.quantity} × {contentTypeLabel(pkg.contentType)}
        </Text>
      </View>
      {/* Amounts are never truncated — the title column yields instead. */}
      <Text variant="body" weight="semibold">
        ₹{pkg.price.toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

/**
 * Wizard step 7 (prompt.md §6.2): a creator can add as many packages as they offer — one per
 * call to `POST /creators/me/packages`, any content type. Each saved package is listed here;
 * the step is still skippable while the list is empty.
 */
export function Step7FirstPackage({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const { colors } = useAppTheme();
  const packages = useCreatorWizardStore((s) => s.data.packages);
  const updateWizard = useCreatorWizardStore((s) => s.update);
  // The form is open until the first package is saved; after that it opens on request.
  const [isFormOpen, setIsFormOpen] = useState(packages.length === 0);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FirstPackageStepInput>({
    resolver: zodResolver(firstPackageStepSchema),
    defaultValues: EMPTY_FORM,
  });

  const quantity = watch('quantity') || 1;

  const mutation = useMutation({
    mutationFn: async (values: FirstPackageStepInput): Promise<WizardPackage> => {
      const contentType = values.contentType as ContentType;
      const price = Number(values.price);
      const { id } = await createPackage({
        title: values.title,
        contentType,
        quantity: values.quantity,
        price,
        description: values.description || undefined,
      });
      return { id, title: values.title.trim(), contentType, quantity: values.quantity, price };
    },
    onSuccess: (pkg) => {
      // Read the latest list at save time rather than the one captured when the request started.
      updateWizard({ packages: [...useCreatorWizardStore.getState().data.packages, pkg] });
      haptics.light();
      reset(EMPTY_FORM);
      setIsFormOpen(false);
    },
    onError: (error) => toast.error('Could not create package', getApiErrorMessage(error)),
  });

  const hasPackages = packages.length > 0;

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text variant="h1">Add your packages</Text>
        <Text variant="body" color="secondary">
          Add one for each thing you offer — reels, posts, stories, videos and more. You can edit
          these later.
        </Text>
      </View>

      {hasPackages && (
        <View className="rounded-md border border-border bg-surface px-4">
          {packages.map((pkg, i) => (
            <PackageRow key={`${pkg.id}-${i}`} pkg={pkg} isFirst={i === 0} />
          ))}
        </View>
      )}

      {isFormOpen ? (
        <View className="gap-5">
          {hasPackages && <Text variant="h3">Another package</Text>}

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
            <Text variant="bodySm" weight="medium">
              Quantity
            </Text>
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => setValue('quantity', Math.max(1, quantity - 1))}
                className="h-12 w-12 items-center justify-center rounded-md border border-border bg-surface active:bg-base"
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Minus size={16} color={colors.text.primary} />
              </Pressable>
              <Text variant="h3" className="min-w-6 text-center">
                {quantity}
              </Text>
              <Pressable
                onPress={() => setValue('quantity', quantity + 1)}
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
            <Button size="lg" loading={mutation.isPending} onPress={handleSubmit((v) => mutation.mutate(v))}>
              Save Package
            </Button>
            {hasPackages ? (
              <Button
                variant="ghost"
                disabled={mutation.isPending}
                onPress={() => {
                  reset(EMPTY_FORM);
                  setIsFormOpen(false);
                }}
              >
                Cancel
              </Button>
            ) : (
              <Button variant="ghost" disabled={mutation.isPending} onPress={onSkip}>
                Skip for now
              </Button>
            )}
          </View>
        </View>
      ) : (
        <View className="gap-2">
          <Button size="lg" onPress={onNext}>
            Finish
          </Button>
          <Button
            variant="secondary"
            size="lg"
            leftIcon={<Plus size={18} color={colors.text.primary} />}
            onPress={() => setIsFormOpen(true)}
          >
            Add Another Package
          </Button>
        </View>
      )}
    </View>
  );
}
