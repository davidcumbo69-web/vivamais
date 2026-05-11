import { QueryClient } from '@tanstack/react-query';

// Configure the QueryClient with extreme performance settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 10 minutes
      staleTime: 1000 * 60 * 10, 
      // Cache remains in memory for 30 minutes before being garbage collected
      gcTime: 1000 * 60 * 30, 
      // Only 1 retry on failure to avoid hitting API limit
      retry: 1, 
      // Performance optimize: do not refetch on standard triggers
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      // Refetch only when explicit or stale
    },
    mutations: {
      // Invalidate related queries on any success by default (can be overridden)
      onSuccess: () => {
        // queryClient.invalidateQueries() - handled specifically in hooks
      },
      retry: 0, // Fail fast on mutations
    },
  },
});

// Helper to invalidate a module
export const invalidateModule = (key: string | string[]) => {
  queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
};
