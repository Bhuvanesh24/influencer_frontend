import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  getLatestStatsSubmission,
  getMyCreatorProfile,
  submitStats,
  type StatsSubmission,
  type StatsSubmissionInput,
} from '@/lib/api/creator';
import { CREATOR_PROFILE_QUERY_KEY, CREATOR_STATS_QUERY_KEY as STATS_QUERY_KEY } from '@/lib/query-keys';
import { toast } from '@/lib/toast';

const STATUS: Record<StatsSubmission['verificationStatus'], { label: string; tone: 'info' | 'positive' | 'held' | 'danger'; body: string }> = {
  pending: { label: 'Under review', tone: 'info', body: 'Our team checks the screenshots against your numbers, usually within a day.' },
  verified: { label: 'Verified', tone: 'positive', body: 'Brands see that your numbers were checked.' },
  verified_with_caveat: { label: 'Verified with a note', tone: 'held', body: 'Verified, with a note from the reviewer.' },
  rejected: { label: 'Not verified', tone: 'danger', body: 'The screenshots did not match. You can submit again.' },
};

/**
 * Stats Submission (prompt.md §6.4): optional evidence that backs up the follower range shown on
 * the profile. Trust Score is automatic, so this is framed as a credibility boost, not a gate.
 */
export default function StatsSubmissionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const latest = useQuery({ queryKey: STATS_QUERY_KEY, queryFn: getLatestStatsSubmission });
  const profile = useQuery({ queryKey: CREATOR_PROFILE_QUERY_KEY, queryFn: getMyCreatorProfile });

  const [fields, setFields] = useState({
    instagramHandle: '',
    instagramFollowers: '',
    instagramEngRate: '',
    instagramAvgLikes: '',
    instagramAvgComments: '',
    youtubeChannelUrl: '',
    youtubeSubscribers: '',
    youtubeAvgViews: '',
  });
  const [igShot, setIgShot] = useState<string | null>(null);
  const [ytShot, setYtShot] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const set = (key: keyof typeof fields) => (value: string) => setFields((f) => ({ ...f, [key]: value }));
  const digits = (key: keyof typeof fields) => (value: string) => set(key)(value.replace(/\D/g, ''));

  const engRate = fields.instagramEngRate === '' ? undefined : Number(fields.instagramEngRate);
  const engError = engRate !== undefined && (!Number.isFinite(engRate) || engRate > 100) ? 'A percentage from 0 to 100' : undefined;
  const ytUrlError =
    fields.youtubeChannelUrl && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/\S+/i.test(fields.youtubeChannelUrl)
      ? 'Paste the full channel link'
      : undefined;
  const shotError = showErrors && !igShot && !ytShot ? 'Add at least one screenshot of your insights' : undefined;

  const submit = useMutation({
    mutationFn: () => {
      const num = (v: string) => (v === '' ? undefined : Number(v));
      const input: StatsSubmissionInput = {
        instagramHandle: fields.instagramHandle.trim().replace(/^@/, '') || undefined,
        instagramFollowers: num(fields.instagramFollowers),
        instagramEngRate: engRate,
        instagramAvgLikes: num(fields.instagramAvgLikes),
        instagramAvgComments: num(fields.instagramAvgComments),
        youtubeChannelUrl: fields.youtubeChannelUrl.trim() || undefined,
        youtubeSubscribers: num(fields.youtubeSubscribers),
        youtubeAvgViews: num(fields.youtubeAvgViews),
      };
      return submitStats(input, { instagram: igShot, youtube: ytShot });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CREATOR_PROFILE_QUERY_KEY });
      toast.success('Sent for review', 'You will see the result here.');
      router.back();
    },
    onError: (error) => toast.error('Could not submit', getApiErrorMessage(error)),
  });

  function onSubmit() {
    setShowErrors(true);
    if (engError || ytUrlError || (!igShot && !ytShot)) return;
    submit.mutate();
  }

  const status = latest.data ? STATUS[latest.data.verificationStatus] : null;
  const hasYoutube = !!profile.data?.youtubeChannelUrl;

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">Boost your credibility</Text>
        <Text variant="body" color="secondary">
          Optional. Share your latest numbers with a screenshot of your insights and our team checks them.
          Brands see a verified mark next to your audience size.
        </Text>
      </View>

      {latest.isPending ? (
        <SkeletonBlock className="h-24 w-full" radius={12} />
      ) : latest.data && status ? (
        <View className="gap-2 rounded-md border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text variant="body" weight="semibold">
              Last submission
            </Text>
            <StatusBadge label={status.label} tone={status.tone} />
          </View>
          <Text variant="bodySm" color="secondary">
            {status.body} Sent {dayjs(latest.data.submittedAt).format('D MMM YYYY')}.
          </Text>
          {latest.data.reviewNotes && <Text variant="bodySm">“{latest.data.reviewNotes}”</Text>}
        </View>
      ) : null}

      {latest.data?.verificationStatus !== 'pending' && (
        <>
          <View className="gap-4">
            <Text variant="h3">Instagram</Text>
            <Input
              label="Handle"
              placeholder={profile.data?.instagramHandle ?? 'yourhandle'}
              autoCapitalize="none"
              leftIcon={<Text color="muted">@</Text>}
              value={fields.instagramHandle}
              onChangeText={set('instagramHandle')}
            />
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input label="Followers" keyboardType="number-pad" value={fields.instagramFollowers} onChangeText={digits('instagramFollowers')} />
              </View>
              <View className="flex-1">
                <Input
                  label="Engagement %"
                  keyboardType="decimal-pad"
                  value={fields.instagramEngRate}
                  onChangeText={(t) => set('instagramEngRate')(t.replace(/[^\d.]/g, ''))}
                  error={engError}
                />
              </View>
            </View>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input label="Avg likes" keyboardType="number-pad" value={fields.instagramAvgLikes} onChangeText={digits('instagramAvgLikes')} />
              </View>
              <View className="flex-1">
                <Input label="Avg comments" keyboardType="number-pad" value={fields.instagramAvgComments} onChangeText={digits('instagramAvgComments')} />
              </View>
            </View>
            <ScreenshotSlot label="Insights screenshot" uri={igShot} onChange={setIgShot} />
          </View>

          <View className="gap-4">
            <Text variant="h3">YouTube {hasYoutube ? '' : '(optional)'}</Text>
            <Input
              label="Channel link"
              placeholder={profile.data?.youtubeChannelUrl ?? 'https://youtube.com/@channel'}
              autoCapitalize="none"
              keyboardType="url"
              value={fields.youtubeChannelUrl}
              onChangeText={set('youtubeChannelUrl')}
              error={showErrors ? ytUrlError : undefined}
            />
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input label="Subscribers" keyboardType="number-pad" value={fields.youtubeSubscribers} onChangeText={digits('youtubeSubscribers')} />
              </View>
              <View className="flex-1">
                <Input label="Avg views" keyboardType="number-pad" value={fields.youtubeAvgViews} onChangeText={digits('youtubeAvgViews')} />
              </View>
            </View>
            <ScreenshotSlot label="Studio screenshot" uri={ytShot} onChange={setYtShot} />
          </View>

          {shotError && (
            <Text variant="caption" color="danger">
              {shotError}
            </Text>
          )}
          <Button size="lg" loading={submit.isPending} onPress={onSubmit}>
            Send for review
          </Button>
        </>
      )}
    </Screen>
  );
}

function ScreenshotSlot({ label, uri, onChange }: { label: string; uri: string | null; onChange: (uri: string | null) => void }) {
  const { colors } = useAppTheme();
  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      toast.error('Screenshot too large', 'Pick an image under 5 MB.');
      return;
    }
    onChange(asset.uri);
  }
  if (uri) {
    return (
      <View className="self-start">
        <Image source={{ uri }} style={{ width: 96, height: 128, borderRadius: 12 }} contentFit="cover" />
        <Pressable
          onPress={() => onChange(null)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label.toLowerCase()}`}
          className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full border border-border bg-surface"
        >
          <X size={14} color={colors.text.primary} />
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable
      onPress={pick}
      accessibilityRole="button"
      className="min-h-13 flex-row items-center gap-3 rounded-md border border-dashed border-border bg-surface px-4 py-3 active:bg-base"
    >
      <ImagePlus size={20} strokeWidth={1.5} color={colors.text.secondary} />
      <Text variant="bodySm" color="secondary">
        {label} (max 5 MB)
      </Text>
    </Pressable>
  );
}
