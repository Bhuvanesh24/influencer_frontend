import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/auth/secure-storage';
import type { AuthSession, AuthTokens, AuthUser } from '@/lib/auth/types';

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  /** True until the persisted store has finished rehydrating from secure storage. */
  isHydrating: boolean;
  setSession: (session: AuthSession) => void;
  setUser: (user: AuthUser) => void;
  setTokens: (tokens: AuthTokens) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isHydrating: true,
      setSession: (session) => set({ user: session.user, tokens: session.tokens }),
      setUser: (user) => set({ user }),
      setTokens: (tokens) => set({ tokens }),
      clear: () => set({ user: null, tokens: null }),
    }),
    {
      name: 'influencehub-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
      onRehydrateStorage: () => () => {
        // Runs once storage.getItem resolves, well after this module has finished evaluating.
        useAuthStore.setState({ isHydrating: false });
      },
    },
  ),
);

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.tokens !== null);
}
