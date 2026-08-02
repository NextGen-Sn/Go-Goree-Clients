import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { LaravelPaginated, unwrapPaginated, unwrapResource } from "@/api/normalize";
import { Billet, CategorieTarif, PaymentMode, PurchaseResult } from "@/types/billet";
import { Ticket, TicketStatus } from "@/types";
import { ROUTE } from "@/constants/trip";
import { CATEGORIE_LABELS } from "@/constants/categorie";
import { describeDate, formatHeureDepart } from "@/utils/date";

export interface PurchasePayload {
  voyageId: string;
  paymentMode: PaymentMode;
  categorie?: CategorieTarif;
}

// POST /billets renvoie `billet`/`payement` à plat (pas de wrapping { data }) : ce
// n'est pas le retour direct d'une Resource côté Laravel, juste un objet imbriqué.
interface PurchaseResponseBody {
  message: string;
  billet: Billet;
  payement: unknown;
  redirect_url: string | null;
}

export const billetService = {
  async list(): Promise<Billet[]> {
    // Scopé automatiquement aux billets de l'utilisateur connecté côté backend.
    const { data } = await apiClient.get<LaravelPaginated<Billet>>(endpoints.billets.list);
    return unwrapPaginated(data);
  },

  async purchase(payload: PurchasePayload): Promise<PurchaseResult> {
    const { data } = await apiClient.post<PurchaseResponseBody>(endpoints.billets.create, {
      voyage_id: payload.voyageId,
      payment_mode: payload.paymentMode,
      categorie: payload.categorie,
    });
    return { billet: data.billet, redirectUrl: data.redirect_url };
  },

  async get(id: string): Promise<Billet> {
    const { data } = await apiClient.get<{ data: Billet }>(endpoints.billets.detail(id));
    return unwrapResource(data);
  },
};

function mapBilletStatut(statut: Billet["statut"]): TicketStatus {
  switch (statut) {
    case "EN_ATTENTE_PAIEMENT":
      return "en_attente";
    case "PAYE":
      return "valide";
    case "UTILISE":
      return "utilisé";
    case "EXPIRE":
      return "expiré";
    case "ANNULE":
      // Pas de statut local dédié à l'annulation pour l'instant : traité comme
      // "expiré" (billet inutilisable), à affiner si un badge distinct est requis.
      return "expiré";
  }
}

/**
 * Les labels sont dérivés des relations voyage/tarif quand elles sont chargées
 * (cas de GET /billets et /billets/{id}) ; `extra` permet de les fournir
 * explicitement quand on les connaît déjà (flux d'achat). Voyage/tarif peuvent
 * être null (entité supprimée côté admin) : on retombe sur un libellé neutre.
 */
export function mapBilletToTicket(
  billet: Billet,
  extra?: { dateLabel?: string; passengersLabel?: string }
): Ticket {
  let dateLabel = extra?.dateLabel;
  if (!dateLabel) {
    if (billet.voyage) {
      // date_voyage arrive en datetime ISO complet dans les réponses billets.
      const day = describeDate(billet.voyage.date_voyage.slice(0, 10)).label;
      // `trajet` peut être null (trajet supprimé côté admin, ou relation non
      // chargée) : sans cette précaution, un seul billet abîmé fait échouer le
      // rendu de toute la liste des billets.
      const heure = billet.voyage.trajet?.heure_depart;
      dateLabel = heure ? `${day} • ${formatHeureDepart(heure)}` : day;
    } else {
      dateLabel = "Voyage indisponible";
    }
  }

  const passengersLabel =
    extra?.passengersLabel ??
    (billet.tarif ? `1 ${CATEGORIE_LABELS[billet.tarif.categorie]}` : "1 passager");

  return {
    id: billet.id,
    qrToken: billet.qr_token,
    departure: ROUTE.departure,
    destination: ROUTE.destination,
    dateLabel,
    passengersLabel,
    total: Number(billet.montant),
    purchasedAt: billet.created_at,
    status: mapBilletStatut(billet.statut),
  };
}
