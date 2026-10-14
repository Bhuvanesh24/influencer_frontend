import { Image } from 'expo-image';
import { MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { FollowerRangeLabels, TrustBadge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { CreatorCardData } from '@/lib/api/discovery';
import { formatMoney } from '@/lib/money';

/**
 * One creator in the Discover grid (prompt.md §6.5 CreatorCard): photo, name, up to three niches,
 * platform + follower range (a range, never a count), trust, starting price and location.
 */
export function CreatorCard({ creator, onPress, footer }: { creator: CreatorCardData; onPress: () => void; footer?: ReactNode }) {
  const { colors } = useAppTheme();
  const name = creator.displayName || 'Creator';
  const shown = creator.niches.slice(0, 3);
  const more = creator.niches.length - shown.length;
  const platformLabel =
    creator.platforms?.length === 2 ? 'IG + YT' : creator.platforms?.[0] === 'youtube' ? 'YT' : 'IG';

  return (
    <View className="flex-1 overflow-hidden rounded-md border border-border bg-surface">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${name}${creator.creatorTitle ? `, ${creator.creatorTitle}` : ''}`}
        className="active:opacity-80"
      >
        <View className="h-16 bg-selected">
          {creator.coverPhoto && <Image source={{ uri: creator.coverPhoto }} style={{ flex: 1 }} contentFit="cover" />}
        </View>
        <View className="-mt-7 gap-2 px-3 pb-3">
          <View className="self-start rounded-full border-2 border-surface">
            <Avatar name={name} uri={creator.profilePhotoUrl} size="md" showAvailability isAvailable={creator.isAvailable} />
          </View>
          <View className="gap-0.5">
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="caption" color="secondary" numberOfLines={1}>
              {creator.creatorTitle ?? ' '}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-1">
            {shown.map((n) => (
              <View key={n} className="rounded-full bg-base px-2 py-0.5">
                <Text variant="caption" color="secondary">
                  {n}
                </Text>
              </View>
            ))}
            {more > 0 && (
              <View className="rounded-full bg-base px-2 py-0.5">
                <Text variant="caption" color="secondary">
                  +{more}
                </Text>
              </View>
            )}
          </View>

          {creator.followerRange && (
            <Text variant="caption" weight="semibold">
              {platformLabel} · {FollowerRangeLabels[creator.followerRange]}
            </Text>
          )}
          <TrustBadge score={creator.trustScore} size="sm" />

          <View className="gap-1 border-t border-border pt-2">
            <Text variant="bodySm" weight="semibold">
              {creator.startingPrice ? `From ${formatMoney(creator.startingPrice)}` : 'No packages yet'}
            </Text>
            {(creator.city || creator.state) && (
              <View className="flex-row items-center gap-1">
                <MapPin size={12} color={colors.text.muted} />
                <Text variant="caption" color="muted" numberOfLines={1} className="flex-1">
                  {[creator.city, creator.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
      {footer}
    </View>
  );
}
