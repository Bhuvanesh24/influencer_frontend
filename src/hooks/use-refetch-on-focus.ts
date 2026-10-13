import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Refetches when the screen regains focus (prompt.md §5: money and status change from other
 * parties and cron jobs, not just this client). Skips the first focus — the query's own mount
 * fetch covers that.
 */
export function useRefetchOnFocus(refetch: () => unknown) {
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
