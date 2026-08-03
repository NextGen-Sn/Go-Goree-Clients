import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { LaravelPaginated, unwrapPaginated } from "@/api/normalize";

/** Forme renvoyée par l'API (modèle brut, non enveloppé dans une Resource). */
interface ApiNotification {
  id: string;
  type: "PAYEMENT" | "ALERTE";
  titre: string | null;
  message: string | null;
  canal: string;
  lu_a: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  type: "PAYEMENT" | "ALERTE";
  titre: string;
  message: string;
  lue: boolean;
  createdAt: string;
}

/**
 * Titre de repli pour les notifications créées avant que le contenu ne soit
 * persisté en base : leur texte n'existe nulle part, on ne peut que nommer
 * leur nature.
 */
const TITRE_PAR_TYPE: Record<ApiNotification["type"], string> = {
  PAYEMENT: "Paiement",
  ALERTE: "Alerte",
};

function mapNotification(item: ApiNotification): Notification {
  return {
    id: item.id,
    type: item.type,
    titre: item.titre ?? TITRE_PAR_TYPE[item.type] ?? "Notification",
    message: item.message ?? "",
    lue: Boolean(item.lu_a),
    createdAt: item.created_at,
  };
}

export const notificationService = {
  /** GET /notifications — scopé à l'utilisateur connecté côté backend. */
  async list(): Promise<Notification[]> {
    const { data } = await apiClient.get<LaravelPaginated<ApiNotification>>(
      endpoints.notifications.list
    );
    return unwrapPaginated(data).map(mapNotification);
  },

  /** PUT /notifications/{id} — marque comme lue (renseigne `lu_a`). */
  async marquerLue(id: string): Promise<void> {
    await apiClient.put(endpoints.notifications.detail(id));
  },
};
