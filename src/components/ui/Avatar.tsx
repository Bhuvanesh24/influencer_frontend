import { Image } from 'expo-image';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

const sizeMap = { sm: 32, md: 44, lg: 64, xl: 96 } as const;

/** Deterministic background so the same name always gets the same fallback color. */
const FALLBACK_PALETTE = ['#5B4FE8', '#2E6FE8', '#12875A', '#B7791F', '#D64545', '#0E7490'];
function colorForName(name: string): string {
  const hash = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}
function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
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

  return (
    <View className={cn('relative', className)} style={{ width: px, height: px }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: px, height: px, borderRadius: px / 2 }}
          contentFit="cover"
          transition={150}
          accessibilityLabel={name}
        />
      ) : (
        <View
          className="items-center justify-center rounded-full"
          style={{ width: px, height: px, backgroundColor: colorForName(name) }}
          accessible
          accessibilityLabel={name}
        >
          <Text weight="bold" color="inverse" style={{ fontSize: px * 0.38 }}>
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
