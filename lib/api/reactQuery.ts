import { QueryClient } from "@tanstack/react-query";

export const DEFAULT_QUERY_STALE_TIME_MS = 5 * 60 * 1000;
export const DEFAULT_QUERY_GC_TIME_MS = 30 * 60 * 1000;
export const BACKGROUND_REVALIDATION_STALE_TIME_MS = 60 * 1000;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: BACKGROUND_REVALIDATION_STALE_TIME_MS,
        gcTime: DEFAULT_QUERY_GC_TIME_MS,
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
