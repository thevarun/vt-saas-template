'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * TanStack Query provider.
 *
 * Mounted once in the root `[locale]/layout.tsx` so every `useQuery` /
 * `useMutation` / `useQueryClient` in the app has a client in the tree —
 * without it those hooks throw "No QueryClient set".
 *
 * The `QueryClient` is created lazily via `useState(() => …)` so it is
 * instantiated exactly once per provider mount (not on every render) and is not
 * shared across requests on the server.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Avoid refetch storms on tab focus; favour explicit invalidation
            // (see the wrapper-hook pattern in src/libs/hooks/).
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
