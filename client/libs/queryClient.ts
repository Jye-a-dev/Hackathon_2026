'use client';

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,          // 30s: feed data stays fresh
      gcTime: 1000 * 60 * 5,         // 5min cache
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
