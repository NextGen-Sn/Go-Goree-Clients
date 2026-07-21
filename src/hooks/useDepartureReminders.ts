import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { billetService } from "@/services/billet.service";
import { BILLETS_QUERY_KEY } from "@/hooks/useBillets";
import { syncDepartureReminders } from "@/utils/departureReminders";

/**
 * Programme des rappels locaux de départ à partir des billets de l'utilisateur.
 * Partage le cache de useBillets (même queryKey) : aucun appel réseau
 * supplémentaire. À monter une seule fois (layout des onglets).
 */
export function useDepartureReminders() {
  const { data: billets } = useQuery({
    queryKey: BILLETS_QUERY_KEY,
    queryFn: billetService.list,
  });

  useEffect(() => {
    if (billets && billets.length > 0) {
      syncDepartureReminders(billets);
    }
  }, [billets]);
}
