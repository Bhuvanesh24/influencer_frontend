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

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    bg: {
      base: '#FAFAFA',
      surface: '#FFFFFF',
      surfaceRaised: '#FFFFFF',
    },
    border: {
      subtle: '#E9EAEC',
    },
    text: {
      primary: '#101317',
      secondary: '#5B6270',
      muted: '#9BA1AD',
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
      base: '#0B0D10',
      surface: '#15181D',
      surfaceRaised: '#1C2026',
    },
    border: {
      subtle: '#262B33',
    },
    text: {
      primary: '#F2F3F5',
      secondary: '#9BA1AD',
      muted: '#5B6270',
    },
    brand: {
      primary: '#8A7FFF',
      primaryPress: '#7A6FEE',
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
  md: 12,
  lg: 20,
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
