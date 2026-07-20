import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { Plan } from "@/types/resident";

export const planService = {
  async list(): Promise<Plan[]> {
    // GET /plans renvoie un tableau JSON brut (pas de wrapping, pas de pagination).
    const { data } = await apiClient.get<Plan[]>(endpoints.plans.list);
    return data;
  },
};
