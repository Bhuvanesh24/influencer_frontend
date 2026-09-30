import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { MultiSelectField } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { updateCreatorProfile } from '@/lib/api/creator';
import { getApiErrorMessage } from '@/lib/api/client';
import { useCreatorWizardStore } from '@/lib/auth/creator-wizard-store';
import { LANGUAGES, NICHES } from '@/lib/constants';
import { toast } from '@/lib/toast';
import { languagesNichesStepSchema, type LanguagesNichesStepInput } from '@/lib/validation/creator-wizard';

const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l, label: l }));
const NICHE_OPTIONS = NICHES.map((n) => ({ value: n, label: n }));
const MAX_NICHES = 5;

export function Step3LanguagesNiches({ onNext }: { onNext: () => void }) {
  const wizard = useCreatorWizardStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LanguagesNichesStepInput>({
    resolver: zodResolver(languagesNichesStepSchema),
    defaultValues: { languages: wizard.data.languages, niches: wizard.data.niches },
  });

  const mutation = useMutation({
    mutationFn: (values: LanguagesNichesStepInput) => updateCreatorProfile(values),
    onSuccess: (_data, values) => {
      wizard.update(values);
      onNext();
    },
    onError: (error) => toast.error('Could not save', getApiErrorMessage(error)),
  });

  return (
    <View className="gap-5">
      <Text variant="h1" weight="bold">
        Languages & niches
      </Text>

      <Controller
        control={control}
        name="languages"
        render={({ field: { onChange, value } }) => (
          <MultiSelectField
            label="Languages you create in"
            placeholder="Select languages"
            searchable
            values={value}
            onChange={onChange}
            options={LANGUAGE_OPTIONS}
            error={errors.languages?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="niches"
        render={({ field: { onChange, value } }) => (
          <MultiSelectField
            label="Your niches"
            placeholder="Select up to 5"
            searchable
            max={MAX_NICHES}
            values={value}
            onChange={onChange}
            options={NICHE_OPTIONS}
            error={errors.niches?.message}
          />
        )}
      />

      <Button size="lg" loading={mutation.isPending} onPress={handleSubmit((v) => mutation.mutate(v))}>
        Continue
      </Button>
    </View>
  );
}
