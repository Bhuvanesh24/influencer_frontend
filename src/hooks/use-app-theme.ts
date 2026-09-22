import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

import { Colors, type ThemeColors } from '@/lib/theme';

/**
 * Resolves the active color scheme (respecting a manual override set via Settings §6.3, or the
 * system default) and returns both the NativeWind controls and the raw token object for
 * consumers that can't take a Tailwind className (SVG icon `color` props, chart config, etc).
 */
export function useAppTheme(): {
  colorScheme: 'light' | 'dark';
  colors: ThemeColors;
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
  toggleColorScheme: () => void;
} {
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativeWindColorScheme();
  const resolved = colorScheme ?? 'light';

  return {
    colorScheme: resolved,
    colors: Colors[resolved],
    setColorScheme,
    toggleColorScheme,
  };
}
