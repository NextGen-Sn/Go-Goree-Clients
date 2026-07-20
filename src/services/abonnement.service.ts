import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { PaymentMode } from "@/types/billet";

// Modes acceptés : tout sauf PORTEFEUILLE possible ici (le backend accepte
// PORTEFEUILLE pour une souscription, contrairement à la recharge du wallet).
export type SouscriptionMode = PaymentMode;

// Réponse JSON brute du AbonnementController@souscrire.
interface SouscrireResponseBody {
  message: string;
  abonnement: unknown | null; // non-null => activé immédiatement (portefeuille)
  reference: string;
  redirect_url: string | null;
}

export interface SouscriptionResult {
  activatedImmediately: boolean;
  reference: string;
  redirectUrl: string | null;
}

export const abonnementService = {
  async souscrire(planId: string, paymentMode: SouscriptionMode): Promise<SouscriptionResult> {
    const { data } = await apiClient.post<SouscrireResponseBody>(endpoints.abonnements.souscrire, {
      plan_id: planId,
      payment_mode: paymentMode,
    });
    return {
      activatedImmediately: data.abonnement !== null,
      reference: data.reference,
      redirectUrl: data.redirect_url,
    };
  },
};
