import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CircleAlert } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, View } from 'react-native';

import { FollowerRangeLabels, type FollowerRange } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { MultiSelectField, SelectField } from '@/components/ui/Select';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  getMyCreatorProfile,
  updateCreatorProfile,
  type CreatorProfile,
  type CreatorProfileUpdate,
} from '@/lib/api/creator';
import { INDIAN_STATES, LANGUAGES, NICHES } from '@/lib/constants';
import { CREATOR_DASHBOARD_QUERY_KEY, CREATOR_PROFILE_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { creatorProfileEditSchema, type CreatorProfileEditInput } from '@/lib/validation/creator-profile';

const MAX_NICHES = 5;

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;
const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));
const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l, label: l }));
const NICHE_OPTIONS = NICHES.map((n) => ({ value: n, label: n }));
const FOLLOWER_RANGE_OPTIONS = (Object.keys(FollowerRangeLabels) as FollowerRange[]).map((value) => ({
  value,
  label: FollowerRangeLabels[value],
}));

function toFormValues(profile: CreatorProfile): CreatorProfileEditInput {
  return {
    creatorTitle: profile.creatorTitle ?? '',
    bio: profile.bio ?? '',
    gender: profile.gender ?? null,
    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
    state: profile.state ?? '',
    district: profile.district ?? '',
    city: profile.city ?? '',
    languages: profile.languages,
    niches: profile.niches,
    instagramHandle: (profile.instagramHandle ?? '').replace(/^@/, ''),
    instagramFollowerRange: profile.instagramFollowerRange,
    youtubeChannelUrl: profile.youtubeChannelUrl ?? '',
    youtubeSubscriberRange: profile.youtubeSubscriberRange,
    featuredReelUrl: profile.featuredReelUrl ?? '',
  };
}

/** Only sends what has a value: the backend treats every field as optional, and enum/date
 * fields can't be sent blank. Text fields are sent as typed, so they can be cleared. */
function toPayload(values: CreatorProfileEditInput): CreatorProfileUpdate {
  return {
    creatorTitle: values.creatorTitle,
    bio: values.bio,
    district: values.district,
    city: values.city,
    languages: values.languages,
    niches: values.niches,
    instagramHandle: values.instagramHandle,
    youtubeChannelUrl: values.youtubeChannelUrl,
    featuredReelUrl: values.featuredReelUrl,
    country: 'India',
    ...(values.state && { state: values.state }),
    ...(values.gender && { gender: values.gender }),
    ...(values.dateOfBirth && { dateOfBirth: values.dateOfBirth.toISOString() }),
    ...(values.instagramFollowerRange && { instagramFollowerRange: values.instagramFollowerRange }),
    ...(values.youtubeSubscriberRange && { youtubeSubscriberRange: values.youtubeSubscriberRange }),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-5">
      <Text variant="h2">{title}</Text>
      {children}
    </View>
  );
}

function EditProfileForm({ profile }: { profile: CreatorProfile }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreatorProfileEditInput>({
    resolver: zodResolver(creatorProfileEditSchema),
    defaultValues: toFormValues(profile),
  });

  const mutation = useMutation({
    mutationFn: (values: CreatorProfileEditInput) => updateCreatorProfile(toPayload(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CREATOR_PROFILE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREATOR_DASHBOARD_QUERY_KEY });
      toast.success('Profile updated');
      router.back();
    },
    onError: (error) => toast.error('Could not save your profile', getApiErrorMessage(error)),
  });

  const sixteenYearsAgo = new Date();
  sixteenYearsAgo.setFullYear(sixteenYearsAgo.getFullYear() - 16);

  return (
    <View className="gap-10">
      <Section title="About you">
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
              value={value}
              onChange={(v) => {
                Keyboard.dismiss();
                onChange(v);
              }}
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
              value={value}
              onChange={onChange}
              maximumDate={sixteenYearsAgo}
              helperText="Not shown publicly"
              error={errors.dateOfBirth?.message}
            />
          )}
        />
      </Section>

      <Section title="Location">
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
            <Input
              label="District (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.district?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input label="City" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.city?.message} />
          )}
        />
      </Section>

      <Section title="Languages & niches">
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
      </Section>

      <Section title="Social accounts">
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
              value={value}
              onChange={onChange}
              options={FOLLOWER_RANGE_OPTIONS}
              error={errors.instagramFollowerRange?.message}
            />
          )}
        />
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
              value={value}
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
      </Section>

      {/* One global save; it stays disabled until something has changed. */}
      <Button
        size="lg"
        disabled={!isDirty}
        loading={mutation.isPending}
        onPress={handleSubmit((values) => mutation.mutate(values))}
      >
        Save Changes
      </Button>
    </View>
  );
}

/**
 * Edit Creator Profile (prompt.md §6.4): the wizard's field groups on one screen with section
 * headers and a single Save. Loads `GET /creators/me`, saves with `PUT /creators/me/profile`.
 * Photos, phone verification and packages are not edited here — see SPRINTS.md 2.1.
 */
export default function EditCreatorProfileScreen() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: CREATOR_PROFILE_QUERY_KEY,
    queryFn: getMyCreatorProfile,
  });

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">Edit profile</Text>
        <Text variant="body" color="secondary">
          This is what brands see when they find you.
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
          title="Couldn't load your profile"
          description={getApiErrorMessage(error, 'Check your connection and try again.')}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : (
        // Mounted only once the profile is loaded, so the form's defaults are the saved values.
        <EditProfileForm profile={data} />
      )}
    </Screen>
  );
}
