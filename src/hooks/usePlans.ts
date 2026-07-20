import { useQuery } from "@tanstack/react-query";
import { planService } from "@/services/plan.service";

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: planService.list,
    staleTime: 5 * 60_000,
  });
}
