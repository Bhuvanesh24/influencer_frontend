import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { updateCreatorProfile } from '@/lib/api/creator';
import { getApiErrorMessage } from '@/lib/api/client';
import { useCreatorWizardStore } from '@/lib/auth/creator-wizard-store';
import { INDIAN_STATES } from '@/lib/constants';
import { toast } from '@/lib/toast';
import { locationStepSchema, type LocationStepInput } from '@/lib/validation/creator-wizard';

const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));

export function Step2Location({ onNext }: { onNext: () => void }) {
  const wizard = useCreatorWizardStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationStepInput>({
    resolver: zodResolver(locationStepSchema),
    defaultValues: {
      country: wizard.data.country,
      state: wizard.data.state,
      district: wizard.data.district,
      city: wizard.data.city,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: LocationStepInput) => updateCreatorProfile(values),
    onSuccess: (_data, values) => {
      wizard.update(values);
      onNext();
    },
    onError: (error) => toast.error('Could not save', getApiErrorMessage(error)),
  });

  return (
    <View className="gap-5">
      <Text variant="h1" weight="bold">
        Where are you based?
      </Text>

      <Input label="Country" value="India" editable={false} />

      <Controller
        control={control}
        name="state"
        render={({ field: { onChange, value } }) => (
          <SelectField
            label="State"
            placeholder="Select your state"
            searchable
            value={value || null}
            onChange={onChange}
            options={STATE_OPTIONS}
            error={errors.state?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="district"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="District (optional)" value={value} onChangeText={onChange} onBlur={onBlur} />
        )}
      />

      <Controller
        control={control}
        name="city"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="City" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.city?.message} />
        )}
      />

      <Button size="lg" loading={mutation.isPending} onPress={handleSubmit((v) => mutation.mutate(v))}>
        Continue
      </Button>
    </View>
  );
}
