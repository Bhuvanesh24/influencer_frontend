import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnReconnect: true,
      // Money/status screens opt into `refetchOnWindowFocus` per-query (prompt.md §5) —
      // default stays off so cheap static lookups don't refetch on every tab focus.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
