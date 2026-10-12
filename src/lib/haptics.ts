import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Thin wrapper so call sites don't each need a Platform check (haptics are iOS/Android only,
 * no-op on web) or a dangling promise. Used sparingly, at genuinely meaningful moments — a
 * completed step, a selection toggle, a success/error outcome — not on every tap.
 */
function fire(fn: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  fn().catch(() => {});
}

export const haptics = {
  /** Light tap — selecting a card/chip/option. */
  selection: () => fire(() => Haptics.selectionAsync()),
  /** A step completed, a form advanced. */
  light: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A meaningful action succeeded (payment, submission, OTP verified). */
  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** A meaningful action failed (validation error surfaced, submission rejected). */
  error: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
