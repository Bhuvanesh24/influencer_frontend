/**
 * Design tokens (prompt.md §3). This is the source of truth for raw values needed outside
 * Tailwind className strings — SVG icon colors, chart colors, dynamic status→color maps.
 * Tailwind utility classes (bg-base, text-ink, text-accent, etc., see tailwind.config.js) are
 * generated from the same values via the CSS variables in src/global.css — keep both in sync.
 */
export interface ThemeColors {
  /** `selected` is the tinted surface behind a chosen option (chip, segment, card). */
  bg: { base: string; surface: string; surfaceRaised: string; selected: string };
  border: { subtle: string };
  /** `inverse` is the label/icon color on any filled surface (action, accent, danger). */
  /** `disabled` is the label on a disabled control: 4.5:1+ on `border.subtle`, `base` and `surface`. */
  text: { primary: string; secondary: string; muted: string; inverse: string; disabled: string };
  /** Primary-button fill — ink in light, ivory in dark. Not used for selected states. */
  action: { primary: string; primaryPress: string };
  /**
   * The one restrained accent (sage). `primary` is for borders, check marks and icons (it is
   * below 4.5:1 as small text); `strong` is the same hue darkened for link and label text.
   */
  accent: { primary: string; strong: string };
  money: { positive: string; held: string };
  status: { danger: string; info: string };
  trust: { high: string; medium: string; low: string };
}

/**
 * Light editorial palette (2026-10-13, second pass): near-white warm base, white surfaces, soft
 * stone borders, charcoal ink, one muted-sage accent. The app is pinned to this scheme — see
 * `APP_COLOR_SCHEME` below. Every text color clears 4.5:1 on `base` and `surface`; on `selected`
 * surfaces text is always `primary`.
 */
export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    bg: {
      base: '#FAF9F6',
      surface: '#FFFFFF',
      surfaceRaised: '#FFFFFF',
      selected: '#F2F5F0',
    },
    border: {
      subtle: '#E8E5DF',
    },
    text: {
      primary: '#202020',
      secondary: '#706F69',
      muted: '#73726C',
      inverse: '#FFFFFF',
      disabled: '#65645E',
    },
    action: {
      primary: '#202020',
      primaryPress: '#3A3A3A',
    },
    accent: {
      primary: '#667B62',
      strong: '#52664E',
    },
    money: {
      positive: '#2A7550',
      held: '#946312',
    },
    status: {
      danger: '#B5382F',
      info: '#2F5FB3',
    },
    trust: {
      high: '#2A7550',
      medium: '#946312',
      low: '#B5382F',
    },
  },
  dark: {
    bg: {
      base: '#121210',
      surface: '#1C1B19',
      surfaceRaised: '#262522',
      selected: '#232A22',
    },
    border: {
      subtle: '#33312D',
    },
    text: {
      primary: '#F2EFE9',
      secondary: '#B5B0A6',
      muted: '#969186',
      inverse: '#191919',
      disabled: '#B5B0A6',
    },
    action: {
      primary: '#F2EFE9',
      primaryPress: '#D9D5CC',
    },
    accent: {
      primary: '#94AE8F',
      strong: '#A9C2A4',
    },
    money: {
      positive: '#6FCF97',
      held: '#E5B567',
    },
    status: {
      danger: '#EE7D72',
      info: '#7FA8F0',
    },
    trust: {
      high: '#6FCF97',
      medium: '#E5B567',
      low: '#EE7D72',
    },
  },
};

export type ColorScheme = keyof typeof Colors;

/**
 * The app always renders this scheme, whatever the device's dark-mode setting. The dark token set
 * above is kept (unpolished) for a future Settings toggle; nothing reads it today.
 */
export const APP_COLOR_SCHEME: ColorScheme = 'light';

export const Spacing = {
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  13: 52,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  40: 160,
} as const;

/** sm: chips and small controls. md: buttons, inputs, cards. lg: sheets and large surfaces. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

/** Minimum interactive hit area (44pt). Smaller visuals reach it with `hitSlop`, not by growing. */
export const MIN_HIT_SIZE = 44;

export const Typography = {
  display: { fontSize: 34, lineHeight: 40, letterSpacing: -0.8, fontFamily: 'Manrope_700Bold' },
  h1: { fontSize: 28, lineHeight: 34, letterSpacing: -0.6, fontFamily: 'Manrope_700Bold' },
  h2: { fontSize: 22, lineHeight: 28, letterSpacing: -0.3, fontFamily: 'Manrope_700Bold' },
  h3: { fontSize: 17, lineHeight: 24, letterSpacing: -0.1, fontFamily: 'Manrope_600SemiBold' },
  body: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter_400Regular' },
  bodySm: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: 'Inter_500Medium' },
} as const;

/** Trust score → token color + label, one source of truth (prompt.md §1, §3.4 TrustBadge). */
export const TrustScoreMeta = {
  high: { label: 'Strong Track Record', emoji: '🟢', colorToken: 'trust.high' },
  medium: { label: 'Building Reputation', emoji: '🟡', colorToken: 'trust.medium' },
  low: { label: 'Caution — See Notes', emoji: '🔴', colorToken: 'trust.low' },
} as const;

export type TrustScore = keyof typeof TrustScoreMeta;
