import AsyncStorage from '@react-native-async-storage/async-storage';

// `.v2`: the intro was redesigned (2026-10-13), so devices that dismissed the old carousel see
// the new one once. Bump the suffix again only for another deliberate re-show.
const WELCOME_SEEN_KEY = 'findcollab.welcomeCarouselSeen.v2';
const HOW_IT_WORKS_SEEN_KEY = 'findcollab.howItWorksSeen';

/**
 * First-run intro slides are shown once per device, not per account (prompt.md §6.1). The flag is
 * written only when the user finishes or skips the slides — never on open — so an interrupted
 * first run starts the intro again. A failed read counts as "not seen": showing the intro twice
 * is harmless, hanging on the splash screen is not.
 */
export async function hasSeenWelcomeCarousel(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(WELCOME_SEEN_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function markWelcomeCarouselSeen(): Promise<void> {
  await AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true');
}

/** Dev aid: lets the intro be replayed without clearing app data. */
export async function resetWelcomeCarousel(): Promise<void> {
  await AsyncStorage.removeItem(WELCOME_SEEN_KEY);
}

/** Role-specific "How It Works" is shown once after onboarding (prompt.md §6.2) — prompt.md
 * doesn't specify the persistence mechanism, so this mirrors the welcome-carousel pattern. */
export async function hasSeenHowItWorks(): Promise<boolean> {
  return (await AsyncStorage.getItem(HOW_IT_WORKS_SEEN_KEY)) === 'true';
}

export async function markHowItWorksSeen(): Promise<void> {
  await AsyncStorage.setItem(HOW_IT_WORKS_SEEN_KEY, 'true');
}

/** One-time inline mechanic explainers (Trust Score, escrow, draft approval, follower range —
 * prompt.md §9) — dismissible per-mechanic so they don't nag on repeat views. */
export async function hasSeenExplainer(key: string): Promise<boolean> {
  return (await AsyncStorage.getItem(`findcollab.explainer.${key}`)) === 'true';
}

export async function markExplainerSeen(key: string): Promise<void> {
  await AsyncStorage.setItem(`findcollab.explainer.${key}`, 'true');
}

const PUSH_PREF_KEY = 'findcollab.pushEnabled';

/** The user's push-notification choice from Settings. Defaults to on. */
export async function getPushPreference(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PUSH_PREF_KEY)) !== 'false';
  } catch {
    return true;
  }
}

export async function setPushPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PUSH_PREF_KEY, String(enabled));
  } catch {
    // Not critical; the toggle simply won't persist.
  }
}
