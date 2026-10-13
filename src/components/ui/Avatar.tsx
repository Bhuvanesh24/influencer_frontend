import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

const sizeMap = { sm: 32, md: 44, lg: 64, xl: 96 } as const;

/**
 * First letter of the first and last word. `Array.from` splits by code point, so a name that
 * starts with an emoji or a non-BMP character yields that character instead of half a
 * surrogate pair.
 */
function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const picked = parts.length === 1 ? [parts[0]] : [parts[0], parts[parts.length - 1]];
  return picked.map((p) => (Array.from(p)[0] ?? '').toUpperCase()).join('');
}

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: keyof typeof sizeMap;
  /** Small ring shown for "online"/"available" creator state (prompt.md §3.4). */
  showAvailability?: boolean;
  isAvailable?: boolean;
  className?: string;
}

export function Avatar({ uri, name, size = 'md', showAvailability, isAvailable, className }: AvatarProps) {
  const px = sizeMap[size];
  // Remember *which* uri failed, so a new uri gets a fresh attempt without an effect.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = Boolean(uri) && failedUri !== uri;

  return (
    <View className={cn('relative shrink-0', className)} style={{ width: px, height: px }}>
      {showImage ? (
        <Image
          source={{ uri: uri ?? undefined }}
          style={{ width: px, height: px, borderRadius: px / 2 }}
          contentFit="cover"
          transition={150}
          accessibilityLabel={name}
          onError={() => setFailedUri(uri ?? null)}
        />
      ) : (
        // One quiet neutral for every fallback — photography carries the color, not placeholders.
        <View
          className="items-center justify-center rounded-full bg-border"
          style={{ width: px, height: px }}
          accessible
          accessibilityLabel={name}
        >
          <Text
            weight="semibold"
            color="secondary"
            allowFontScaling={false}
            style={{ fontSize: px * 0.38, lineHeight: px * 0.5 }}
          >
            {initialsForName(name)}
          </Text>
        </View>
      )}
      {showAvailability && (
        <View
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-surface',
            isAvailable ? 'bg-money-positive' : 'bg-ink-muted',
          )}
          style={{ width: px * 0.28, height: px * 0.28 }}
        />
      )}
    </View>
  );
}
