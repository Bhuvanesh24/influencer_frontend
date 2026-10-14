import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getApiErrorMessage } from '@/lib/api/client';
import {
  BRAND_DASHBOARD_QUERY_KEY,
  CAMPAIGNS_QUERY_KEY,
  COLLABS_QUERY_KEY,
  CREATOR_DASHBOARD_QUERY_KEY,
  MESSAGES_QUERY_KEY,
  NOTIFICATIONS_QUERY_KEY,
  WALLET_QUERY_KEY,
} from '@/lib/query-keys';
import { toast } from '@/lib/toast';

/** Everything a deal action can change: the deal itself, both dashboards, chat, money, campaigns. */
export function useInvalidateDealData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [
        COLLABS_QUERY_KEY,
        CREATOR_DASHBOARD_QUERY_KEY,
        BRAND_DASHBOARD_QUERY_KEY,
        NOTIFICATIONS_QUERY_KEY,
        MESSAGES_QUERY_KEY,
        WALLET_QUERY_KEY,
        CAMPAIGNS_QUERY_KEY,
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
}

/**
 * A deal lifecycle action (accept, pay, submit, verify…): runs it, refreshes every affected
 * query, and toasts the outcome. Errors show the server's own message (prompt.md §9).
 */
export function useDealMutation<TVars = void>(
  action: (vars: TVars) => Promise<unknown>,
  feedback: { success: string; successBody?: string; errorTitle?: string; onSuccess?: () => void },
) {
  const invalidate = useInvalidateDealData();
  return useMutation({
    mutationFn: action,
    onSuccess: async () => {
      await invalidate();
      toast.success(feedback.success, feedback.successBody);
      feedback.onSuccess?.();
    },
    onError: (error) => {
      toast.error(feedback.errorTitle ?? 'Could not do that', getApiErrorMessage(error));
    },
  });
}
