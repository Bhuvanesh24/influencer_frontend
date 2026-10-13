import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Building2 } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, Pressable, Switch, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SelectField } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { updateBrandProfile, uploadBrandLogo } from '@/lib/api/brand';
import { getApiErrorMessage } from '@/lib/api/client';
import { NICHES } from '@/lib/constants';
import { toast } from '@/lib/toast';
import { brandProfileSchema, type BrandProfileInput } from '@/lib/validation/brand';

const INDUSTRY_OPTIONS = NICHES.map((n) => ({ value: n, label: n }));

/**
 * prompt.md §6.2: reachable from Settings, not force-shown at onboarding — brand onboarding is
 * intentionally fast. Settings itself doesn't exist yet (Sprint 8.2), so this is temporarily
 * reachable from `/coming-soon` for a Brand account; move that entry point once Settings ships.
 */
export default function BrandProfileSetupScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandProfileInput>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      companyName: '',
      website: '',
      industry: '',
      description: '',
      country: 'India',
      phone: '',
      gstin: '',
      showBrandNameInCollabs: true,
    },
  });

  async function pickLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  }

  const mutation = useMutation({
    mutationFn: async (values: BrandProfileInput) => {
      if (logoUri) await uploadBrandLogo(logoUri);
      await updateBrandProfile(values);
    },
    onSuccess: () => {
      toast.success('Company profile updated');
      router.back();
    },
    onError: (error) => toast.error('Could not save', getApiErrorMessage(error)),
  });

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-6 px-6 pt-2">
      <ScreenHeader />

      <View className="gap-2">
        <Text variant="h1">Company profile</Text>
        <Text variant="body" color="secondary">
          Shown to creators when you send a request or invite.
        </Text>
      </View>

      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          pickLogo();
        }}
        accessibilityRole="button"
        accessibilityLabel={logoUri ? 'Change company logo' : 'Add company logo'}
        className="flex-row items-center gap-4 self-start active:opacity-60"
      >
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={{ width: 72, height: 72, borderRadius: 12 }} contentFit="cover" />
        ) : (
          <View className="h-[72px] w-[72px] items-center justify-center rounded-md border border-dashed border-border bg-surface">
            <Building2 size={24} strokeWidth={1.5} color={colors.text.muted} />
          </View>
        )}
        <Text variant="bodySm" weight="semibold" color="accent">
          {logoUri ? 'Change logo' : 'Add logo'}
        </Text>
      </Pressable>

      <Controller
        control={control}
        name="companyName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input label="Company name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.companyName?.message} />
        )}
      />

      <Controller
        control={control}
        name="website"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Website (optional)"
            placeholder="https://yourcompany.com"
            autoCapitalize="none"
            keyboardType="url"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.website?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="industry"
        render={({ field: { onChange, value } }) => (
          <SelectField
            label="Industry"
            placeholder="Select an industry"
            searchable
            value={value || null}
            onChange={onChange}
            options={INDUSTRY_OPTIONS}
            error={errors.industry?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Description"
            multiline
            maxLength={150}
            showCharCount
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.description?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Phone"
            keyboardType="number-pad"
            maxLength={10}
            leftIcon={<Text color="muted">+91</Text>}
            value={value}
            onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
            onBlur={onBlur}
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="gstin"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="GSTIN (optional)"
            autoCapitalize="characters"
            maxLength={15}
            value={value}
            onChangeText={(t) => onChange(t.toUpperCase())}
            onBlur={onBlur}
            error={errors.gstin?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="showBrandNameInCollabs"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center justify-between rounded-md border border-border bg-surface p-4">
            <View className="flex-1 gap-0.5 pr-3">
              <Text variant="body" weight="medium">
                Show brand name in collabs
              </Text>
              <Text variant="bodySm" color="secondary">
                Creators see your company name instead of &quot;A Brand&quot; once a deal is active.
              </Text>
            </View>
            <Switch
              value={value}
              onValueChange={(v) => {
                Keyboard.dismiss();
                onChange(v);
              }}
              trackColor={{ true: colors.accent.primary }}
            />
          </View>
        )}
      />

      <Button size="lg" loading={mutation.isPending} onPress={handleSubmit((v) => mutation.mutate(v))}>
        Save
      </Button>
    </Screen>
  );
}
