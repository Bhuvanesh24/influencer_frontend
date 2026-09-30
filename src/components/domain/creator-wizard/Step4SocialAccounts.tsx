import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { FollowerRangeLabels } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectField } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { updateCreatorProfile } from '@/lib/api/creator';
import { getApiErrorMessage } from '@/lib/api/client';
import { useCreatorWizardStore } from '@/lib/auth/creator-wizard-store';
import { toast } from '@/lib/toast';
import { socialAccountsStepSchema, type SocialAccountsStepInput } from '@/lib/validation/creator-wizard';

const FOLLOWER_RANGE_OPTIONS = Object.entries(FollowerRangeLabels).map(([value, label]) => ({ value, label }));

export function Step4SocialAccounts({ onNext }: { onNext: () => void }) {
  const wizard = useCreatorWizardStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SocialAccountsStepInput>({
    resolver: zodResolver(socialAccountsStepSchema),
    defaultValues: {
      instagramHandle: wizard.data.instagramHandle,
      instagramFollowerRange: wizard.data.instagramFollowerRange ?? undefined,
      youtubeChannelUrl: wizard.data.youtubeChannelUrl,
      youtubeSubscriberRange: wizard.data.youtubeSubscriberRange ?? undefined,
      featuredReelUrl: wizard.data.featuredReelUrl,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: SocialAccountsStepInput) => updateCreatorProfile(values),
    onSuccess: (_data, values) => {
      wizard.update(values);
      onNext();
    },
    onError: (error) => toast.error('Could not save', getApiErrorMessage(error)),
  });

  return (
    <View className="gap-5">
      <Text variant="h1" weight="bold">
        Your social accounts
      </Text>

      <Controller
        control={control}
        name="instagramHandle"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Instagram handle"
            placeholder="yourhandle"
            autoCapitalize="none"
            leftIcon={<Text color="muted">@</Text>}
            value={value}
            onChangeText={(t) => onChange(t.replace('@', ''))}
            onBlur={onBlur}
            error={errors.instagramHandle?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="instagramFollowerRange"
        render={({ field: { onChange, value } }) => (
          <SelectField
            label="Instagram followers"
            placeholder="Select a range"
            value={value ?? null}
            onChange={onChange}
            options={FOLLOWER_RANGE_OPTIONS}
            error={errors.instagramFollowerRange?.message}
          />
        )}
      />

      <Text variant="caption" color="muted">
        We use ranges, not exact numbers — this protects your privacy and can&apos;t be gamed.
      </Text>

      <Controller
        control={control}
        name="youtubeChannelUrl"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="YouTube channel URL (optional)"
            placeholder="https://youtube.com/@yourchannel"
            autoCapitalize="none"
            keyboardType="url"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.youtubeChannelUrl?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="youtubeSubscriberRange"
        render={({ field: { onChange, value } }) => (
          <SelectField
            label="YouTube subscribers (optional)"
            placeholder="Select a range"
            value={value ?? null}
            onChange={onChange}
            options={FOLLOWER_RANGE_OPTIONS}
          />
        )}
      />

      <Controller
        control={control}
        name="featuredReelUrl"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Featured reel URL (optional)"
            placeholder="Link your best work"
            autoCapitalize="none"
            keyboardType="url"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.featuredReelUrl?.message}
          />
        )}
      />

      <Button size="lg" loading={mutation.isPending} onPress={handleSubmit((v) => mutation.mutate(v))}>
        Continue
      </Button>
    </View>
  );
}
