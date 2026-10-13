import AsyncStorage from '@react-native-async-storage/async-storage';

import { refreshAccessToken } from '@/lib/api/client';
import { REFRESH_TIMEOUT_MS, resolveInitialRoute } from '@/lib/auth/initial-route';
import { useAuthStore } from '@/lib/auth/store';
import type { AuthUser } from '@/lib/auth/types';
import {
  hasSeenWelcomeCarousel,
  markHowItWorksSeen,
  markWelcomeCarouselSeen,
  resetWelcomeCarousel,
} from '@/lib/local-flags';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/lib/api/client', () => ({ refreshAccessToken: jest.fn() }));
jest.mock('@/lib/auth/store', () => ({ useAuthStore: { getState: jest.fn() } }));

const mockGetState = useAuthStore.getState as jest.Mock;
const mockRefresh = refreshAccessToken as jest.Mock;

const tokens = { accessToken: 'a', refreshToken: 'r' };
const onboardedUser: AuthUser = {
  id: '1',
  email: 'a@b.co',
  accountType: 'creator',
  displayName: 'A',
  hasBankAccount: true,
  phoneVerified: false,
};

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockGetState.mockReturnValue({ tokens: null, user: null });
  mockRefresh.mockResolvedValue('a');
});

describe('resolveInitialRoute — signed out', () => {
  it('shows the intro slides on a first launch', async () => {
    await expect(resolveInitialRoute()).resolves.toBe('/welcome');
  });

  it('does not wait on a token refresh when there is no session', async () => {
    await resolveInitialRoute();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('shows the intro again if it was opened but never finished or skipped', async () => {
    await resolveInitialRoute();
    await expect(resolveInitialRoute()).resolves.toBe('/welcome');
    await expect(hasSeenWelcomeCarousel()).resolves.toBe(false);
  });

  it('goes straight to login once the intro has been finished or skipped', async () => {
    await markWelcomeCarouselSeen();
    await expect(resolveInitialRoute()).resolves.toBe('/login');
    await expect(resolveInitialRoute()).resolves.toBe('/login');
  });

  it('ignores the pre-redesign completion flag, so the new intro shows once', async () => {
    await AsyncStorage.setItem('findcollab.welcomeCarouselSeen', 'true');
    await expect(resolveInitialRoute()).resolves.toBe('/welcome');
  });

  it('shows the intro again after a reset', async () => {
    await markWelcomeCarouselSeen();
    await resetWelcomeCarousel();
    await expect(resolveInitialRoute()).resolves.toBe('/welcome');
  });

  it('treats an unreadable flag as "not seen" instead of hanging', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(resolveInitialRoute()).resolves.toBe('/welcome');
  });
});

describe('resolveInitialRoute — session on device', () => {
  it('never shows the intro to a signed-in user, even if they never saw it', async () => {
    mockGetState.mockReturnValue({ tokens, user: { ...onboardedUser, accountType: null, hasBankAccount: false } });
    await expect(resolveInitialRoute()).resolves.toBe('/(onboarding)/role-selection');
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('sends an onboarded user who has not seen How It Works there', async () => {
    mockGetState.mockReturnValue({ tokens, user: onboardedUser });
    await expect(resolveInitialRoute()).resolves.toBe('/(onboarding)/how-it-works');
  });

  it('sends a fully onboarded creator to their Home tab', async () => {
    await markHowItWorksSeen();
    mockGetState.mockReturnValue({ tokens, user: onboardedUser });
    await expect(resolveInitialRoute()).resolves.toBe('/creator/home');
  });

  it('sends a fully onboarded brand to their Home tab', async () => {
    await markHowItWorksSeen();
    mockGetState.mockReturnValue({ tokens, user: { ...onboardedUser, accountType: 'brand' } });
    await expect(resolveInitialRoute()).resolves.toBe('/brand/home');
  });

  it('still routes the user when the refresh fails', async () => {
    await markHowItWorksSeen();
    mockRefresh.mockResolvedValue(null);
    mockGetState.mockReturnValue({ tokens, user: onboardedUser });
    await expect(resolveInitialRoute()).resolves.toBe('/creator/home');
  });

  it('gives up waiting on a hung refresh after the timeout', async () => {
    jest.useFakeTimers();
    try {
      await markHowItWorksSeen();
      mockRefresh.mockReturnValue(new Promise(() => {}));
      mockGetState.mockReturnValue({ tokens, user: onboardedUser });

      const route = resolveInitialRoute();
      await jest.advanceTimersByTimeAsync(REFRESH_TIMEOUT_MS);
      await expect(route).resolves.toBe('/creator/home');
    } finally {
      jest.useRealTimers();
    }
  });

  it('falls back to login if routing itself throws', async () => {
    mockGetState.mockImplementation(() => {
      throw new Error('store unavailable');
    });
    await expect(resolveInitialRoute()).resolves.toBe('/login');
  });
});
