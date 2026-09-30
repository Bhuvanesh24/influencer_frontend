import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { updateCreatorProfile } from '@/lib/api/creator';
import { getApiErrorMessage } from '@/lib/api/client';
import { useCreatorWizardStore } from '@/lib/auth/creator-wizard-store';
import { toast } from '@/lib/toast';
import { identityStepSchema, type IdentityStepInput } from '@/lib/validation/creator-wizard';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

const sixteenYearsAgo = new Date();
sixteenYearsAgo.setFullYear(sixteenYearsAgo.getFullYear() - 16);

export function Step1Identity({ onNext }: { onNext: () => void }) {
  const wizard = useCreatorWizardStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IdentityStepInput>({
    resolver: zodResolver(identityStepSchema),
    defaultValues: {
      creatorTitle: wizard.data.creatorTitle,
      bio: wizard.data.bio,
      gender: wizard.data.gender ?? undefined,
      dateOfBirth: wizard.data.dateOfBirth ?? undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: IdentityStepInput) =>
      updateCreatorProfile({
        creatorTitle: values.creatorTitle,
        bio: values.bio,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth.toISOString(),
      }),
    onSuccess: (_data, values) => {
      wizard.update(values);
      onNext();
    },
    onError: (error) => toast.error('Could not save', getApiErrorMessage(error)),
  });

  return (
    <View className="gap-5">
      <View className="gap-1">
        <Text variant="h1" weight="bold">
          Tell us about yourself
        </Text>
      </View>

      <Controller
        control={control}
        name="creatorTitle"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Title"
            placeholder='e.g. "Fashion & Lifestyle Creator"'
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            maxLength={60}
            showCharCount
            error={errors.creatorTitle?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="bio"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Bio"
            placeholder="A short intro brands will see on your profile"
            multiline
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            maxLength={300}
            showCharCount
            error={errors.bio?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="gender"
        render={({ field: { onChange, value } }) => (
          <SegmentedControl
            label="Gender"
            wrap
            options={GENDER_OPTIONS}
            value={value ?? null}
            onChange={onChange}
            error={errors.gender?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field: { onChange, value } }) => (
          <DateField
            label="Date of birth"
            value={value ?? null}
            onChange={onChange}
            maximumDate={sixteenYearsAgo}
            helperText="Not shown publicly"
            error={errors.dateOfBirth?.message}
          />
        )}
      />

      <Button size="lg" loading={mutation.isPending} onPress={handleSubmit((v) => mutation.mutate(v))}>
        Continue
      </Button>
    </View>
  );
}
