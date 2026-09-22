import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_SEEN_KEY = 'influencehub.welcomeCarouselSeen';

/** First-run welcome carousel is shown once, ever (prompt.md §6.1) — device-local, not per-account. */
export async function hasSeenWelcomeCarousel(): Promise<boolean> {
  return (await AsyncStorage.getItem(WELCOME_SEEN_KEY)) === 'true';
}

export async function markWelcomeCarouselSeen(): Promise<void> {
  await AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true');
}

/** One-time inline mechanic explainers (Trust Score, escrow, draft approval, follower range —
 * prompt.md §9) — dismissible per-mechanic so they don't nag on repeat views. */
export async function hasSeenExplainer(key: string): Promise<boolean> {
  return (await AsyncStorage.getItem(`influencehub.explainer.${key}`)) === 'true';
}

export async function markExplainerSeen(key: string): Promise<void> {
  await AsyncStorage.setItem(`influencehub.explainer.${key}`, 'true');
}
