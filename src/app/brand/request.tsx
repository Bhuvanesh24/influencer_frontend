import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Keyboard, Switch, View } from 'react-native';

import { PackageCard } from '@/components/domain/packages/PackageCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { DateField } from '@/components/ui/DateField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonDetailPage } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useInvalidateDealData } from '@/hooks/use-deal-mutation';
import { getApiErrorMessage } from '@/lib/api/client';
import { createDeal } from '@/lib/api/collabs';
import { getCreatorPublicProfile } from '@/lib/api/discovery';
import { DISCOVERY_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { sendRequestSchema, type SendRequestInput } from '@/lib/validation/collab';

/**
 * Send Collab Request (prompt.md §6.5): the package is locked (it decides content type, quantity
 * and list price); the brand writes the brief and can offer a different amount. Success opens
 * the new deal.
 */
export default function SendRequestScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const invalidate = useInvalidateDealData();
  const { creatorUserId, packageId, campaignId } = useLocalSearchParams<{
    creatorUserId: string;
    packageId: string;
    campaignId?: string;
  }>();
  const { data: creator, isPending, isError, error, refetch } = useQuery({
    queryKey: [...DISCOVERY_QUERY_KEY, 'creator', creatorUserId],
    queryFn: () => getCreatorPublicProfile(creatorUserId),
  });
  const pkg = creator?.packages.find((p) => p.id === packageId);

  if (isPending) {
    return (
      <Screen contentClassName="pt-2">
        <ScreenHeader />
        <SkeletonDetailPage />
      </Screen>
    );
  }
  if (isError || !pkg) {
    return (
      <Screen contentClassName="gap-6 pt-2">
        <ScreenHeader />
        <EmptyState
          icon={CircleAlert}
          title={isError ? "Couldn't load this package" : 'This package is no longer available'}
          description={isError ? getApiErrorMessage(error) : 'The creator may have hidden or changed it.'}
          actionLabel={isError ? 'Try again' : 'Go back'}
          onAction={() => (isError ? refetch() : router.back())}
        />
      </Screen>
    );
  }

  const name = creator.displayName ?? 'the creator';

  return (
    <RequestForm
      creatorName={name}
      creatorPhoto={creator.profilePhotoUrl}
      creatorProfileId={creator.id}
      pkg={pkg}
      campaignId={campaignId}
      onSent={async (dealId) => {
        await invalidate();
        toast.success('Request sent', `${name} has 72 hours to respond.`);
        router.dismiss();
        router.push({ pathname: '/brand/collab/[id]', params: { id: dealId } });
      }}
      colors={colors}
    />
  );
}

function RequestForm({
  creatorName,
  creatorPhoto,
  creatorProfileId,
  pkg,
  campaignId,
  onSent,
  colors,
}: {
  creatorName: string;
  creatorPhoto: string | null;
  creatorProfileId: string;
  pkg: NonNullable<Awaited<ReturnType<typeof getCreatorPublicProfile>>['packages'][number]>;
  campaignId?: string;
  onSent: (dealId: string) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const [link, setLink] = useState('');
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SendRequestInput>({
    resolver: zodResolver(sendRequestSchema),
    defaultValues: {
      brief: '',
      offeredAmount: String(Math.round(Number(pkg.price))),
      postingDeadline: dayjs().add(7, 'day').endOf('day').toDate(),
      referenceMaterials: [],
      brandNotes: '',
      requiresDraftApproval: false,
    },
  });
  const links = watch('referenceMaterials');

  const send = useMutation({
    mutationFn: (v: SendRequestInput) =>
      createDeal({
        creatorProfileId,
        packageId: pkg.id,
        brief: v.brief.trim(),
        offeredAmount: Number(v.offeredAmount),
        postingDeadline: v.postingDeadline.toISOString(),
        referenceMaterials: v.referenceMaterials,
        brandNotes: v.brandNotes.trim() || undefined,
        requiresDraftApproval: v.requiresDraftApproval,
        campaignId,
      }),
    onSuccess: ({ id }) => onSent(id),
    onError: (e) => toast.error('Could not send the request', getApiErrorMessage(e)),
  });

  function addLink() {
    const url = link.trim();
    if (!/^https?:\/\/\S+\.\S+/i.test(url)) {
      toast.error('Not a link', 'Paste a full link starting with https://');
      return;
    }
    if (!links.includes(url)) setValue('referenceMaterials', [...links, url]);
    setLink('');
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pb-10 pt-2">
      <ScreenHeader />
      <View className="flex-row items-center gap-3">
        <Avatar name={creatorName} uri={creatorPhoto} size="md" />
        <View className="flex-1">
          <Text variant="caption" color="secondary">
            Request to
          </Text>
          <Text variant="h2" numberOfLines={1}>
            {creatorName}
          </Text>
        </View>
      </View>

      <PackageCard pkg={{ ...pkg, inclusions: [], isActive: true }} mode="display" />

      <View className="gap-6">
        <Controller
          control={control}
          name="brief"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Brief"
              multiline
              maxLength={5000}
              showCharCount
              placeholder="What should the content show? Key messages, do's and don'ts, links to tag."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.brief?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="offeredAmount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Your offer"
              keyboardType="number-pad"
              leftIcon={<Text color="muted">₹</Text>}
              value={value}
              onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
              onBlur={onBlur}
              error={errors.offeredAmount?.message}
              helperText="You can offer above or below the creator's listed price. A 10% platform fee is added at payment."
            />
          )}
        />
        <Controller
          control={control}
          name="postingDeadline"
          render={({ field: { onChange, value } }) => (
            <DateField
              label="Post by"
              value={value}
              onChange={onChange}
              minimumDate={dayjs().add(1, 'day').toDate()}
              error={errors.postingDeadline?.message}
            />
          )}
        />

        <View className="gap-2">
          <Input
            label="Reference material (optional)"
            placeholder="https://drive.example.com/moodboard"
            autoCapitalize="none"
            keyboardType="url"
            value={link}
            onChangeText={setLink}
            onSubmitEditing={addLink}
            returnKeyType="done"
          />
          {links.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {links.map((l) => (
                <Chip
                  key={l}
                  label={l.replace(/^https?:\/\//, '')}
                  onRemove={() => setValue('referenceMaterials', links.filter((x) => x !== l))}
                />
              ))}
            </View>
          )}
          {link.trim() !== '' && (
            <Button variant="ghost" size="sm" fullWidth={false} className="self-start" onPress={addLink}>
              Add link
            </Button>
          )}
        </View>

        <Controller
          control={control}
          name="brandNotes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Notes for the creator (optional)"
              multiline
              maxLength={2000}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.brandNotes?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="requiresDraftApproval"
          render={({ field: { onChange, value } }) => (
            <View className="flex-row items-center gap-3 rounded-md border border-border bg-surface p-4">
              <View className="flex-1 gap-0.5">
                <Text variant="body" weight="medium">
                  Approve a draft before posting
                </Text>
                <Text variant="bodySm" color="secondary">
                  The creator sends you the content to review before they post publicly.
                </Text>
              </View>
              <Switch
                value={value}
                onValueChange={(v) => {
                  Keyboard.dismiss();
                  onChange(v);
                }}
                trackColor={{ true: colors.accent.primary }}
                accessibilityLabel="Approve a draft before posting"
              />
            </View>
          )}
        />
      </View>

      <Button size="lg" loading={send.isPending} onPress={handleSubmit((v) => send.mutate(v))}>
        Send request
      </Button>
      <Text variant="caption" color="muted" className="-mt-4 text-center">
        Nothing is charged now. You pay into escrow only after {creatorName} accepts.
      </Text>
    </Screen>
  );
}
