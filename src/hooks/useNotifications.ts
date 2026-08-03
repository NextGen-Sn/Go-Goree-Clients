import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationService } from "@/services/notification.service";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: notificationService.list,
  });
}

export function useMarquerNotificationLue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.marquerLue(id),
    // Marquage optimiste : la pastille doit disparaître au doigt, sans attendre
    // l'aller-retour réseau. En cas d'échec, on revient à l'état précédent.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const precedent = queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY);

      queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (anciennes: unknown) =>
        Array.isArray(anciennes)
          ? anciennes.map((n) => (n.id === id ? { ...n, lue: true } : n))
          : anciennes
      );

      return { precedent };
    },
    onError: (_err, _id, context) => {
      if (context?.precedent) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.precedent);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}
