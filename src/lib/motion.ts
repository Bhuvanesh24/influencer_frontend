import { Easing } from 'react-native-reanimated';

/**
 * Motion tokens — the one place durations and curves are defined. Kept out of theme.ts so that
 * file stays free of a Reanimated import (it's read by non-UI code too).
 *
 * UI motion stays under 300ms and never uses ease-in. Springs are reserved for motion that
 * follows a gesture; anything that merely appears uses `easing.out` with no overshoot.
 */
export const Motion = {
  duration: {
    /** Press feedback. */
    press: 120,
    /** Small state changes — a field revealing, a chip toggling. */
    fast: 180,
    /** Entrances — a screen's content, a step swapping in. */
    base: 220,
  },
  easing: {
    /** Entering / exiting. */
    out: Easing.bezier(0.23, 1, 0.32, 1),
    /** Moving or morphing while staying on screen. */
    inOut: Easing.bezier(0.77, 0, 0.175, 1),
  },
  /** Scale applied to any pressable surface while held. */
  pressScale: 0.97,
  /** Delay between siblings entering together. */
  stagger: 50,
} as const;
