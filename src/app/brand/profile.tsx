import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CircleAlert } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, Switch, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SelectField } from '@/components/ui/Select';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getBrandProfile, updateBrandProfile, type BrandProfile } from '@/lib/api/brand';
import { getApiErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { NICHES } from '@/lib/constants';
import { BRAND_DASHBOARD_QUERY_KEY, BRAND_PROFILE_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { brandProfileSchema, type BrandProfileInput } from '@/lib/validation/brand';

const INDUSTRY_OPTIONS = NICHES.map((n) => ({ value: n, label: n }));

function BrandProfileForm({ profile, fallbackName }: { profile: BrandProfile; fallbackName: string }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandProfileInput>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      companyName: profile.companyName ?? fallbackName,
      brandWebsite: profile.brandWebsite ?? '',
      industry: profile.industry ?? '',
      description: profile.description ?? '',
      country: profile.country ?? 'India',
      // Stored with or without a country code; the field holds the 10-digit number.
      phone: (profile.phone ?? '').replace(/\D/g, '').slice(-10),
      gstin: profile.gstin ?? '',
      showBrandNameInCollabs: profile.showBrandNameInCollabs,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: BrandProfileInput) =>
      updateBrandProfile({ ...values, brandWebsite: values.brandWebsite || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BRAND_DASHBOARD_QUERY_KEY });
      toast.success('Company profile updated');
      router.back();
    },
    onError: (error) => toast.error('Could not save', getApiErrorMessage(error)),
  });

  return (
    <View className="gap-6">
      <Controller
        control={control}
        name="companyName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Company name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            maxLength={255}
            error={errors.companyName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="brandWebsite"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Website (optional)"
            placeholder="https://yourcompany.com"
            autoCapitalize="none"
            keyboardType="url"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.brandWebsite?.message}
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
              accessibilityLabel="Show brand name in collabs"
            />
          </View>
        )}
      />

      <Button size="lg" loading={mutation.isPending} onPress={handleSubmit((v) => mutation.mutate(v))}>
        Save
      </Button>
    </View>
  );
}

/**
 * Company profile (prompt.md §6.2 "Brand Profile Setup"): loads `GET /brands/me` so it doubles as
 * the edit screen, saves with `PUT /brands/me/profile`. Reached from Brand Home; moves under
 * Settings when that exists (SPRINTS.md 8.2). No logo picker — the backend has no logo upload.
 */
export default function BrandProfileScreen() {
  const onboardingName = useAuthStore((s) => s.user?.displayName) ?? '';
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: BRAND_PROFILE_QUERY_KEY,
    queryFn: getBrandProfile,
  });

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">Company profile</Text>
        <Text variant="body" color="secondary">
          Shown to creators when you send a request or invite.
        </Text>
      </View>

      {isPending ? (
        <View className="gap-5">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-13 w-full" radius={12} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          icon={CircleAlert}
          title="Couldn't load your company profile"
          description={getApiErrorMessage(error, 'Check your connection and try again.')}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : (
        // Mounted only once the profile is loaded, so the form's defaults are the saved values.
        <BrandProfileForm profile={data} fallbackName={onboardingName} />
      )}
    </Screen>
  );
}
