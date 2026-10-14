/**
 * DEV-ONLY MOCK LAYER — lets the whole app be demoed with no backend. Every API function in
 * `src/lib/api/*.ts` branches on `IS_MOCK_API` at its top and, when on, calls the mock server in
 * `src/lib/api/mock/` (an in-memory database shaped like the backend's, seeded with two demo
 * accounts and saved to AsyncStorage). The real network call is what runs otherwise.
 *
 * Default ON. Set `EXPO_PUBLIC_MOCK_API=false` to use the real `apiClient` against
 * `EXPO_PUBLIC_API_BASE_URL`. When the app is bound to the backend, delete this file, the
 * `mock/` folder and every `if (IS_MOCK_API)` branch.
 */
export const IS_MOCK_API = process.env.EXPO_PUBLIC_MOCK_API !== 'false';

/** Simulates network latency so loading states/spinners are actually visible while testing. */
export function mockDelay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export { MOCK_OTP_CODE } from '@/lib/api/mock/auth';
