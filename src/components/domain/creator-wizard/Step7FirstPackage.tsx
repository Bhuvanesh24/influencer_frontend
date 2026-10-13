import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { PackageForm } from '@/components/domain/packages/PackageForm';
import { Button } from '@/components/ui/Button';
import { MoneyText } from '@/components/ui/MoneyText';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { createPackage } from '@/lib/api/creator';
import { getApiErrorMessage } from '@/lib/api/client';
import { useCreatorWizardStore, type WizardPackage } from '@/lib/auth/creator-wizard-store';
import { contentTypeLabel, type ContentType } from '@/lib/constants';
import { haptics } from '@/lib/haptics';
import { CREATOR_PACKAGES_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import type { PackageInput } from '@/lib/validation/creator-wizard';

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
      <MoneyText amount={pkg.price} />
    </View>
  );
}

/**
 * Wizard step 7 (prompt.md §6.2): a creator can add as many packages as they offer — one per
 * call to `POST /creators/me/packages`, any content type. Each saved package is listed here;
 * the step is still skippable while the list is empty. Editing and hiding packages happens on
 * the Packages screen afterwards.
 */
export function Step7FirstPackage({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const packages = useCreatorWizardStore((s) => s.data.packages);
  const updateWizard = useCreatorWizardStore((s) => s.update);
  // The form is open until the first package is saved; after that it opens on request.
  const [isFormOpen, setIsFormOpen] = useState(packages.length === 0);

  const mutation = useMutation({
    mutationFn: async (values: PackageInput): Promise<WizardPackage> => {
      const contentType = values.contentType as ContentType;
      const price = Number(values.price);
      const { id } = await createPackage({
        title: values.title.trim(),
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
      queryClient.invalidateQueries({ queryKey: CREATOR_PACKAGES_QUERY_KEY });
      haptics.light();
      // Closing unmounts the form, so reopening it starts blank.
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
          <PackageForm
            submitLabel="Save Package"
            isSubmitting={mutation.isPending}
            onSubmit={(values) => mutation.mutate(values)}
            secondaryAction={
              hasPackages ? (
                <Button variant="ghost" disabled={mutation.isPending} onPress={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
              ) : (
                <Button variant="ghost" disabled={mutation.isPending} onPress={onSkip}>
                  Skip for now
                </Button>
              )
            }
          />
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
