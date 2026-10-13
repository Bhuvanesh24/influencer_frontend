import { APP_COLOR_SCHEME, Colors, type ColorScheme, type ThemeColors } from '@/lib/theme';

/**
 * Returns the raw token object for consumers that can't take a Tailwind className (SVG icon
 * `color` props, chart config, etc). The app is pinned to one scheme (`APP_COLOR_SCHEME`, set on
 * NativeWind in app/_layout.tsx), so this deliberately does not read the device setting. When a
 * theme toggle ships in Settings, this hook is the one place to make it dynamic again.
 */
export function useAppTheme(): { colorScheme: ColorScheme; colors: ThemeColors } {
  return { colorScheme: APP_COLOR_SCHEME, colors: Colors[APP_COLOR_SCHEME] };
}
