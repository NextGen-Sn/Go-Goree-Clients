import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Une 4xx (401/404/422...) est une erreur métier ou d'auth : la retenter
      // ne changera rien. Seules les erreurs réseau / 5xx méritent 1-2 essais.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status !== undefined && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});
