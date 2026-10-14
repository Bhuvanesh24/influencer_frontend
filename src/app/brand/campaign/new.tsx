import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { Keyboard, Pressable, Switch, View } from 'react-native';

import { CAMPAIGN_TYPE_META } from '@/components/domain/campaigns/CampaignCard';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepProgress } from '@/components/ui/StepProgress';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { createCampaign, type CampaignType, type CreateCampaignInput } from '@/lib/api/campaigns';
import { getApiErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { CONTENT_TYPES, LANGUAGES, NICHES, type ContentType } from '@/lib/constants';
import { CAMPAIGNS_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { campaignFormSchema, type CampaignFormInput } from '@/lib/validation/campaign';

const STEP_FIELDS: Record<1 | 2 | 3, FieldPath<CampaignFormInput>[]> = {
  1: ['type', 'name', 'brief', 'contentType', 'productDescription'],
  2: ['targetNiches', 'targetLanguages', 'hashtags'],
  3: [
    'postingDeadline',
    'totalBudget',
    'targetInfluencerCount',
    'budgetPerCreator',
    'maxCreators',
    'applicationDeadline',
    'minFollowerCount',
    'minEngagementRate',
  ],
};

const TYPE_COPY: Record<CampaignType, string> = {
  BrandInvite: 'You pick the creators and invite them. Each invite is a request they accept or decline.',
  OpenApplication: 'Creators who fit apply with one of their packages. You approve who you want — or auto-accept.',
};

/** Create Campaign (prompt.md §6.5): three short steps, one Create at the end. */
export default function CreateCampaignScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tag, setTag] = useState('');

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormInput>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      type: 'BrandInvite',
      name: '',
      brief: '',
      productDescription: '',
      contentType: '',
      targetNiches: [],
      targetLanguages: [],
      hashtags: [],
      postingDeadline: dayjs().add(21, 'day').endOf('day').toDate(),
      negotiationAllowed: true,
      requiresDraftApproval: false,
      totalBudget: '',
      targetInfluencerCount: '5',
      budgetPerCreator: '',
      maxCreators: '10',
      applicationDeadline: dayjs().add(10, 'day').endOf('day').toDate(),
      minFollowerCount: '',
      minEngagementRate: '',
      autoAccept: false,
    },
  });
  const type = watch('type');
  const hashtags = watch('hashtags');

  const create = useMutation({
    mutationFn: (v: CampaignFormInput) => {
      const base = {
        name: v.name.trim(),
        brief: v.brief.trim(),
        productDescription: v.productDescription.trim() || undefined,
        contentType: v.contentType as ContentType,
        hashtags: v.hashtags,
        targetLanguages: v.targetLanguages,
        targetNiches: v.targetNiches,
        postingDeadline: v.postingDeadline.toISOString(),
        negotiationAllowed: v.negotiationAllowed,
        requiresDraftApproval: v.requiresDraftApproval,
      };
      const input: CreateCampaignInput =
        v.type === 'BrandInvite'
          ? { ...base, type: 'BrandInvite', totalBudget: Number(v.totalBudget), targetInfluencerCount: Number(v.targetInfluencerCount) }
          : {
              ...base,
              type: 'OpenApplication',
              budgetPerCreator: Number(v.budgetPerCreator),
              maxCreators: Number(v.maxCreators),
              applicationDeadline: v.applicationDeadline!.toISOString(),
              minFollowerCount: v.minFollowerCount ? Number(v.minFollowerCount) : undefined,
              minEngagementRate: v.minEngagementRate ? Number(v.minEngagementRate) : undefined,
              autoAccept: v.autoAccept,
            };
      return createCampaign(input);
    },
    onSuccess: ({ id }, v) => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
      toast.success(
        'Campaign created',
        v.type === 'OpenApplication' ? 'It’s live — creators who fit can apply now.' : 'Invite creators to get it going.',
      );
      router.dismiss();
      router.push({ pathname: '/brand/campaign/[id]', params: { id } });
    },
    onError: (e) => toast.error('Could not create the campaign', getApiErrorMessage(e)),
  });

  async function next() {
    if (await trigger(STEP_FIELDS[step])) setStep((s) => (s + 1) as 2 | 3);
  }

  function addTag() {
    const t = tag.trim().replace(/^#*/, '#').replace(/\s+/g, '');
    if (t.length > 1 && !hashtags.includes(t)) setValue('hashtags', [...hashtags, t]);
    setTag('');
  }

  const toggleIn = (field: 'targetNiches' | 'targetLanguages', value: string) => {
    const list = watch(field);
    setValue(field, list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  return (
    <Screen scroll keyboardAvoiding scrollResetKey={step} contentClassName="gap-8 pb-10 pt-2">
      <View className="gap-3">
        <ScreenHeader onBack={step > 1 ? () => setStep((s) => (s - 1) as 1 | 2) : undefined} />
        <StepProgress currentStep={step} totalSteps={3} />
      </View>

      {step === 1 && (
        <View className="gap-6">
          <Text variant="h1">New campaign</Text>
          <Controller
            control={control}
            name="type"
            render={({ field: { value, onChange } }) => (
              <View className="gap-3">
                {(['BrandInvite', 'OpenApplication'] as const).map((t) => {
                  const meta = CAMPAIGN_TYPE_META[t];
                  const Icon = meta.icon;
                  const selected = value === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => onChange(t)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      className={cn('flex-row gap-3 rounded-md border p-4', selected ? 'border-accent bg-selected' : 'border-border bg-surface active:bg-base')}
                    >
                      <Icon size={22} strokeWidth={1.5} color={colors.text.primary} />
                      <View className="flex-1 gap-0.5">
                        <Text variant="body" weight="semibold">
                          {meta.label}
                        </Text>
                        <Text variant="bodySm" color="secondary">
                          {TYPE_COPY[t]}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Campaign name" value={value} onChangeText={onChange} onBlur={onBlur} maxLength={255} error={errors.name?.message} />
            )}
          />
          <Controller
            control={control}
            name="brief"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Brief"
                multiline
                maxLength={5000}
                showCharCount
                placeholder="What should creators make? Key messages, do's and don'ts."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.brief?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="contentType"
            render={({ field: { onChange, value } }) => (
              <Field label="Content type" error={errors.contentType?.message}>
                {CONTENT_TYPES.map((c) => (
                  <Chip key={c.value} label={c.label} selectable selected={value === c.value} onPress={() => onChange(c.value)} />
                ))}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="productDescription"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Product (optional)" multiline maxLength={2000} value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
        </View>
      )}

      {step === 2 && (
        <View className="gap-6">
          <View className="gap-2">
            <Text variant="h1">Who it&apos;s for</Text>
            <Text variant="body" color="secondary">
              {type === 'OpenApplication'
                ? 'Only creators in these niches see the campaign. Leave empty to open it to everyone.'
                : 'Used to suggest creators when you invite. All optional.'}
            </Text>
          </View>
          <Field label="Niches">
            {NICHES.map((n) => (
              <Chip key={n} label={n} selectable selected={watch('targetNiches').includes(n)} onPress={() => toggleIn('targetNiches', n)} />
            ))}
          </Field>
          <Field label="Languages">
            {LANGUAGES.map((l) => (
              <Chip key={l} label={l} selectable selected={watch('targetLanguages').includes(l)} onPress={() => toggleIn('targetLanguages', l)} />
            ))}
          </Field>
          <View className="gap-2">
            <Input label="Hashtags" placeholder="#YourCampaign" autoCapitalize="none" value={tag} onChangeText={setTag} onSubmitEditing={addTag} returnKeyType="done" />
            {hashtags.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {hashtags.map((h) => (
                  <Chip key={h} label={h} onRemove={() => setValue('hashtags', hashtags.filter((x) => x !== h))} />
                ))}
              </View>
            )}
            {tag.trim() !== '' && (
              <Button variant="ghost" size="sm" fullWidth={false} className="self-start" onPress={addTag}>
                Add hashtag
              </Button>
            )}
          </View>
        </View>
      )}

      {step === 3 && (
        <View className="gap-6">
          <Text variant="h1">Budget & timing</Text>
          {type === 'BrandInvite' ? (
            <>
              <Controller
                control={control}
                name="totalBudget"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input label="Total budget" keyboardType="number-pad" leftIcon={<Text color="muted">₹</Text>} value={value} onChangeText={(t) => onChange(t.replace(/\D/g, ''))} onBlur={onBlur} error={errors.totalBudget?.message} helperText="The total you plan to offer across every creator you invite." />
                )}
              />
              <Controller
                control={control}
                name="targetInfluencerCount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input label="How many creators" keyboardType="number-pad" value={value} onChangeText={(t) => onChange(t.replace(/\D/g, ''))} onBlur={onBlur} error={errors.targetInfluencerCount?.message} />
                )}
              />
            </>
          ) : (
            <>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="budgetPerCreator"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input label="Pay per creator" keyboardType="number-pad" leftIcon={<Text color="muted">₹</Text>} value={value} onChangeText={(t) => onChange(t.replace(/\D/g, ''))} onBlur={onBlur} error={errors.budgetPerCreator?.message} />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="maxCreators"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input label="Spots" keyboardType="number-pad" value={value} onChangeText={(t) => onChange(t.replace(/\D/g, ''))} onBlur={onBlur} error={errors.maxCreators?.message} />
                    )}
                  />
                </View>
              </View>
              <Controller
                control={control}
                name="applicationDeadline"
                render={({ field: { onChange, value } }) => (
                  <DateField label="Applications close" value={value} onChange={onChange} minimumDate={dayjs().add(1, 'day').toDate()} error={errors.applicationDeadline?.message} />
                )}
              />
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="minFollowerCount"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input label="Min followers" placeholder="Optional" keyboardType="number-pad" value={value} onChangeText={(t) => onChange(t.replace(/\D/g, ''))} onBlur={onBlur} />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="minEngagementRate"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input label="Min engagement %" placeholder="Optional" keyboardType="decimal-pad" value={value} onChangeText={(t) => onChange(t.replace(/[^\d.]/g, ''))} onBlur={onBlur} error={errors.minEngagementRate?.message} />
                    )}
                  />
                </View>
              </View>
              <Controller
                control={control}
                name="autoAccept"
                render={({ field: { onChange, value } }) => (
                  <Toggle label="Auto-accept" description="First eligible applicants are approved automatically until spots fill." value={value} onChange={onChange} />
                )}
              />
            </>
          )}

          <Controller
            control={control}
            name="postingDeadline"
            render={({ field: { onChange, value } }) => (
              <DateField label="Posts go live by" value={value} onChange={onChange} minimumDate={dayjs().add(1, 'day').toDate()} error={errors.postingDeadline?.message} />
            )}
          />
          <Controller
            control={control}
            name="negotiationAllowed"
            render={({ field: { onChange, value } }) => (
              <Toggle label="Allow counter-offers" description="Creators can propose a different price." value={value} onChange={onChange} />
            )}
          />
          <Controller
            control={control}
            name="requiresDraftApproval"
            render={({ field: { onChange, value } }) => (
              <Toggle label="Approve drafts before posting" description="Creators send you the content to review before it goes live." value={value} onChange={onChange} />
            )}
          />
        </View>
      )}

      {step < 3 ? (
        <Button size="lg" onPress={next}>
          Continue
        </Button>
      ) : (
        <Button size="lg" loading={create.isPending} onPress={handleSubmit((v) => create.mutate(v))}>
          Create campaign
        </Button>
      )}
    </Screen>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text variant="bodySm" weight="medium">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
      {error && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useAppTheme();
  return (
    <View className="flex-row items-center gap-3 rounded-md border border-border bg-surface p-4">
      <View className="flex-1 gap-0.5">
        <Text variant="body" weight="medium">
          {label}
        </Text>
        <Text variant="bodySm" color="secondary">
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Keyboard.dismiss();
          onChange(v);
        }}
        trackColor={{ true: colors.accent.primary }}
        accessibilityLabel={label}
      />
    </View>
  );
}
