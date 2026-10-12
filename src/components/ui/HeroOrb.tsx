import { View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

/**
 * Soft, oversized, low-opacity color washes positioned behind hero content — gives screens a
 * sense of depth/atmosphere without literal gradients or skeuomorphism (prompt.md §3 keeps those
 * off the table). Render as the first child of a `position: relative` container, with real
 * content layered on top via normal flow (orbs are `pointerEvents="none"` and absolutely
 * positioned so they never intercept touches).
 */
export function HeroOrb({ variant = 'top' }: { variant?: 'top' | 'centered' }) {
  const { colors } = useAppTheme();

  if (variant === 'centered') {
    return (
      <View pointerEvents="none" className="absolute inset-0 items-center overflow-hidden">
        <View
          style={{
            width: 420,
            height: 420,
            borderRadius: 210,
            backgroundColor: colors.brand.primary,
            opacity: 0.1,
            top: -160,
          }}
        />
      </View>
    );
  }

  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      <View
        style={{
          position: 'absolute',
          width: 360,
          height: 360,
          borderRadius: 180,
          backgroundColor: colors.brand.primary,
          opacity: 0.12,
          top: -180,
          right: -90,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: colors.money.positive,
          opacity: 0.08,
          top: -40,
          left: -70,
        }}
      />
    </View>
  );
}
