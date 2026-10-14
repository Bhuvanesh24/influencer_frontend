import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { ExternalLink, MapPin, Star } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';

import { PackageCard } from '@/components/domain/packages/PackageCard';
import { Avatar } from '@/components/ui/Avatar';
import { FollowerRangeBadge, StatusBadge, TrustBadge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { CreatorPackage } from '@/lib/api/creator';
import { getCreatorReviews, type CreatorPublicProfile, type PublicPackage } from '@/lib/api/discovery';
import { DISCOVERY_QUERY_KEY } from '@/lib/query-keys';

function asPackage(p: PublicPackage): CreatorPackage {
  return { ...p, inclusions: [], isActive: true };
}

/**
 * Creator Profile Detail (prompt.md §6.5) — the public profile, as brands see it. Brands get a
 * "Request this package" button on each package; the creator's own preview passes none.
 */
export function CreatorPublicView({
  creator,
  onRequestPackage,
  onTrustPress,
}: {
  creator: CreatorPublicProfile;
  onRequestPackage?: (packageId: string) => void;
  onTrustPress?: () => void;
}) {
  const { colors } = useAppTheme();
  const name = creator.displayName || 'Creator';
  const location = [creator.city, creator.state].filter(Boolean).join(', ');
  const reviews = useQuery({
    queryKey: [...DISCOVERY_QUERY_KEY, 'reviews', creator.id],
    queryFn: () => getCreatorReviews(creator.id),
  });

  return (
    <View className="gap-8">
      <View>
        <View className="h-36 overflow-hidden rounded-md bg-selected">
          {creator.coverPhotos[0] && <Image source={{ uri: creator.coverPhotos[0] }} style={{ flex: 1 }} contentFit="cover" />}
        </View>
        <View className="-mt-10 gap-3 px-1">
          <View className="self-start rounded-full border-4 border-base">
            <Avatar name={name} uri={creator.profilePhotoUrl} size="xl" showAvailability isAvailable={creator.isAvailable} />
          </View>
          <View className="gap-1">
            <Text variant="h1">{name}</Text>
            {creator.creatorTitle && (
              <Text variant="body" color="secondary">
                {creator.creatorTitle}
              </Text>
            )}
          </View>
          <View className="flex-row flex-wrap items-center gap-2">
            <TrustBadge score={creator.trustScore} onPress={onTrustPress} />
            {creator.instagramFollowerRange && <FollowerRangeBadge range={creator.instagramFollowerRange} platform="instagram" />}
            {creator.youtubeSubscriberRange && <FollowerRangeBadge range={creator.youtubeSubscriberRange} platform="youtube" />}
            {!creator.isAvailable && <StatusBadge label="Not taking requests" tone="neutral" />}
          </View>
          <View className="flex-row flex-wrap gap-x-4 gap-y-1">
            {location ? (
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color={colors.text.muted} />
                <Text variant="bodySm" color="secondary">
                  {location}
                </Text>
              </View>
            ) : null}
            <Text variant="bodySm" color="secondary">
              {creator.totalCompletedCollabs} collab{creator.totalCompletedCollabs === 1 ? '' : 's'} completed
            </Text>
            {creator.avgRating && (
              <View className="flex-row items-center gap-1">
                <Star size={14} color={colors.money.held} fill={colors.money.held} />
                <Text variant="bodySm" color="secondary">
                  {Number(creator.avgRating).toFixed(1)} ({creator.totalReviews})
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {creator.bio && <Text variant="body">{creator.bio}</Text>}

      <Block title="Creates">
        <View className="flex-row flex-wrap gap-2">
          {creator.niches.map((n) => (
            <Chip key={n} label={n} />
          ))}
        </View>
        {creator.languages.length > 0 && (
          <Text variant="bodySm" color="secondary">
            In {creator.languages.join(', ')}
          </Text>
        )}
      </Block>

      {(creator.featuredReelUrl || creator.instagramHandle || creator.youtubeChannelUrl) && (
        <Block title="Find them on">
          {creator.featuredReelUrl && (
            <LinkRow label="Featured reel" url={creator.featuredReelUrl} />
          )}
          {creator.instagramHandle && (
            <LinkRow label={`@${creator.instagramHandle}`} url={`https://www.instagram.com/${creator.instagramHandle}`} />
          )}
          {creator.youtubeChannelUrl && <LinkRow label="YouTube channel" url={creator.youtubeChannelUrl} />}
        </Block>
      )}

      {creator.coverPhotos.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
          {creator.coverPhotos.slice(1).map((uri) => (
            <Image key={uri} source={{ uri }} style={{ width: 200, height: 140, borderRadius: 12 }} contentFit="cover" />
          ))}
        </ScrollView>
      )}

      <Block title="Packages">
        {creator.packages.length === 0 ? (
          <Text variant="bodySm" color="secondary">
            No packages yet, so this creator can&apos;t be booked right now.
          </Text>
        ) : (
          <View className="gap-3">
            {creator.packages.map((p) => (
              <PackageCard
                key={p.id}
                pkg={asPackage(p)}
                mode="display"
                actionLabel={onRequestPackage && creator.isAvailable ? 'Request this package' : undefined}
                onAction={onRequestPackage ? () => onRequestPackage(p.id) : undefined}
              />
            ))}
          </View>
        )}
        {onRequestPackage && !creator.isAvailable && creator.packages.length > 0 && (
          <Text variant="caption" color="secondary">
            {name} isn&apos;t taking requests right now. Save them to a list to come back later.
          </Text>
        )}
      </Block>

      <Block title="Reviews from brands">
        {reviews.data && reviews.data.reviews.length > 0 ? (
          <View className="gap-3">
            {reviews.data.reviews.map((r) => (
              <View key={r.id} className="gap-1 rounded-md border border-border bg-surface p-4">
                <View className="flex-row items-center justify-between">
                  <Text variant="bodySm" weight="semibold">
                    {r.brand.companyName ?? 'A brand'}
                  </Text>
                  <Text variant="caption" color="muted">
                    {dayjs(r.createdAt).format('MMM YYYY')}
                  </Text>
                </View>
                <Text variant="bodySm">
                  {'★'.repeat(r.rating)}
                  <Text variant="bodySm" color="muted">
                    {'★'.repeat(5 - r.rating)}
                  </Text>
                </Text>
                {r.comment && (
                  <Text variant="bodySm" color="secondary">
                    {r.comment}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text variant="bodySm" color="secondary">
            {reviews.isPending ? 'Loading…' : 'No reviews yet.'}
          </Text>
        )}
      </Block>
    </View>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text variant="h3">{title}</Text>
      {children}
    </View>
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      className="min-h-11 flex-row items-center gap-2 rounded-md border border-border bg-surface px-3 active:bg-base"
    >
      <ExternalLink size={16} color={colors.text.primary} />
      <Text variant="bodySm" weight="medium" className="flex-1" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
