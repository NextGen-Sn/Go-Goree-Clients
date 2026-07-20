import { useQuery } from "@tanstack/react-query";
import { residentService } from "@/services/resident.service";

export const DEMANDES_RESIDENCE_QUERY_KEY = ["demandes-residence"] as const;

export function useDemandesResidence() {
  return useQuery({
    queryKey: DEMANDES_RESIDENCE_QUERY_KEY,
    queryFn: residentService.listDemandes,
  });
}
