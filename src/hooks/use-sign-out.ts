import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import * as authApi from '@/lib/api/auth';
import { useAuthStore } from '@/lib/auth/store';

/** Ends the session on the server (best effort), drops every cached query, and returns to Login. */
export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clear);

  return useCallback(
    (destination: '/login' | '/welcome' = '/login') => {
      authApi.logout().catch(() => {});
      // Drop cached server data so the next account never sees this one's.
      queryClient.clear();
      clearSession();
      router.replace(destination);
    },
    [clearSession, queryClient, router],
  );
}
