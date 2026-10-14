import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useConfirmSheet } from '@/components/ui/ConfirmSheet';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDealMutation } from '@/hooks/use-deal-mutation';
import { getDeal, submitPost } from '@/lib/api/collabs';
import { counterpartName } from '@/lib/collab-view';
import { collabDetailKey } from '@/lib/query-keys';
import { toast } from '@/lib/toast';

type Platform = 'instagram' | 'youtube';

const PATTERNS: Record<Platform, RegExp> = {
  instagram: /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv|stories)\/[\w.-]+/i,
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)[\w-]+/i,
};

function detectPlatform(url: string): Platform | null {
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  return null;
}

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

/** Submit Post (prompt.md §6.4): the live post's link, for the brand to verify within 48 hours. */
export default function SubmitPostScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: deal } = useQuery({ queryKey: collabDetailKey(id), queryFn: () => getDeal(id) });
  const { ask, sheet } = useConfirmSheet();

  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>(
    deal?.package?.platform === 'youtube' ? 'youtube' : 'instagram',
  );
  const [touched, setTouched] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const trimmed = url.trim();
  const urlError =
    touched && !trimmed
      ? 'Paste the link to your post'
      : touched && !PATTERNS[platform].test(trimmed)
        ? platform === 'instagram'
          ? 'That doesn’t look like an Instagram post link (instagram.com/p/… or /reel/…)'
          : 'That doesn’t look like a YouTube video link (youtube.com/watch?v=… or youtu.be/…)'
        : undefined;

  const brand = deal ? counterpartName(deal, 'creator') : 'The brand';
  const submit = useDealMutation(() => submitPost(id, { postUrl: trimmed, platform, screenshotUri: screenshot }), {
    success: 'Post submitted',
    successBody: `${brand} has 48 hours to verify it.`,
    onSuccess: () => router.back(),
  });

  async function pickScreenshot() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_SCREENSHOT_BYTES) {
      toast.error('Screenshot too large', 'Pick an image under 5 MB.');
      return;
    }
    setScreenshot(asset.uri);
  }

  return (
    <Screen scroll keyboardAvoiding contentClassName="gap-8 pt-2">
      <ScreenHeader />
      <View className="gap-2">
        <Text variant="h1">Submit your post</Text>
        <Text variant="body" color="secondary">
          Paste the link to the live post. {brand} checks it and releases your payment.
        </Text>
      </View>

      <View className="gap-6">
        <Input
          label="Post link"
          placeholder={platform === 'instagram' ? 'https://www.instagram.com/reel/…' : 'https://youtu.be/…'}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={url}
          onChangeText={(t) => {
            setUrl(t);
            const detected = detectPlatform(t);
            if (detected) setPlatform(detected);
          }}
          onBlur={() => setTouched(true)}
          error={urlError}
        />
        <SegmentedControl
          label="Platform"
          options={[
            { value: 'instagram', label: 'Instagram' },
            { value: 'youtube', label: 'YouTube' },
          ]}
          value={platform}
          onChange={setPlatform}
        />

        <View className="gap-2">
          <Text variant="bodySm" weight="medium">
            Screenshot (optional)
          </Text>
          {screenshot ? (
            <View className="self-start">
              <Image source={{ uri: screenshot }} style={{ width: 120, height: 160, borderRadius: 12 }} contentFit="cover" />
              <Pressable
                onPress={() => setScreenshot(null)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Remove screenshot"
                className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full border border-border bg-surface"
              >
                <X size={14} color={colors.text.primary} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickScreenshot}
              accessibilityRole="button"
              className="min-h-13 flex-row items-center gap-3 rounded-md border border-dashed border-border bg-surface px-4 py-3 active:bg-base"
            >
              <ImagePlus size={20} strokeWidth={1.5} color={colors.text.secondary} />
              <Text variant="bodySm" color="secondary">
                Add a screenshot of the live post (max 5 MB)
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Button
        size="lg"
        loading={submit.isPending}
        onPress={() => {
          setTouched(true);
          if (!PATTERNS[platform].test(trimmed)) return;
          ask({
            title: 'Submit for review?',
            description: `Once submitted, ${brand} has 48 hours to verify — after that it auto-approves and you get paid.`,
            confirmLabel: 'Submit for review',
            onConfirm: () => submit.mutate(),
          });
        }}
      >
        Submit for review
      </Button>
      {sheet}
    </Screen>
  );
}
