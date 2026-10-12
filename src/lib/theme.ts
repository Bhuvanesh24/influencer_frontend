/**
 * Design tokens (prompt.md §3). This is the source of truth for raw values needed outside
 * Tailwind className strings — SVG icon colors, chart colors, dynamic status→color maps.
 * Tailwind utility classes (bg-base, text-ink, text-brand, etc., see tailwind.config.js) are
 * generated from the same values via the CSS variables in src/global.css — keep both in sync.
 */
export interface ThemeColors {
  bg: { base: string; surface: string; surfaceRaised: string };
  border: { subtle: string };
  text: { primary: string; secondary: string; muted: string };
  brand: { primary: string; primaryPress: string };
  money: { positive: string; held: string };
  status: { danger: string; info: string };
  trust: { high: string; medium: string; low: string };
}

/**
 * "Premium creator-platform" palette (2026-10-12 refresh): warm ivory neutrals in light mode and
 * plum-tinted charcoal in dark mode, both built around the same brand violet as the app icon (so
 * the icon never needed regenerating) instead of the earlier flat cold-gray neutrals.
 */
export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    bg: {
      base: '#FAF8F5',
      surface: '#FFFFFF',
      surfaceRaised: '#FFFFFF',
    },
    border: {
      subtle: '#EAE4DC',
    },
    text: {
      primary: '#1A1720',
      secondary: '#655D6E',
      muted: '#9C94A6',
    },
    brand: {
      primary: '#5B4FE8',
      primaryPress: '#4A3FD1',
    },
    money: {
      positive: '#12875A',
      held: '#B7791F',
    },
    status: {
      danger: '#D64545',
      info: '#2E6FE8',
    },
    trust: {
      high: '#12875A',
      medium: '#B7791F',
      low: '#D64545',
    },
  },
  dark: {
    bg: {
      base: '#100C18',
      surface: '#1A1424',
      surfaceRaised: '#231B2F',
    },
    border: {
      subtle: '#2F2640',
    },
    text: {
      primary: '#F6F3FA',
      secondary: '#AEA3BE',
      muted: '#6C6280',
    },
    brand: {
      primary: '#9485FF',
      primaryPress: '#8172F2',
    },
    money: {
      positive: '#3DDC97',
      held: '#F0B94E',
    },
    status: {
      danger: '#F27171',
      info: '#6B9CFF',
    },
    trust: {
      high: '#12875A',
      medium: '#B7791F',
      low: '#D64545',
    },
  },
};

export type ColorScheme = keyof typeof Colors;

export const Spacing = {
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 22,
  full: 9999,
} as const;

export const Typography = {
  display: { fontSize: 32, lineHeight: 40, fontFamily: 'Manrope_700Bold' },
  h1: { fontSize: 24, lineHeight: 32, fontFamily: 'Manrope_700Bold' },
  h2: { fontSize: 20, lineHeight: 28, fontFamily: 'Manrope_700Bold' },
  h3: { fontSize: 17, lineHeight: 24, fontFamily: 'Manrope_600SemiBold' },
  body: { fontSize: 15, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  bodySm: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  caption: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_500Medium' },
} as const;

/** Trust score → token color + label, one source of truth (prompt.md §1, §3.4 TrustBadge). */
export const TrustScoreMeta = {
  high: { label: 'Strong Track Record', emoji: '🟢', colorToken: 'trust.high' },
  medium: { label: 'Building Reputation', emoji: '🟡', colorToken: 'trust.medium' },
  low: { label: 'Caution — See Notes', emoji: '🔴', colorToken: 'trust.low' },
} as const;

export type TrustScore = keyof typeof TrustScoreMeta;
