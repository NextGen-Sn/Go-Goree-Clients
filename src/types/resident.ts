export type DemandeStatut = "EN_COURS" | "ACCEPTEE" | "REFUSEE" | "ANNULEE";

export interface DemandeResidence {
  id: string;
  nom: string;
  carte_identite: string;
  residence: string;
  statut: DemandeStatut;
  photo: string | null;
  cni_recto: string | null;
  cni_verso: string | null;
  certificat_residence: string | null;
  motif_refus: string | null;
  date_validation: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  nom: string;
  duree_mois: number;
  prix: string; // décimal Laravel sérialisé en string
  actif: boolean;
}

// Résumé de l'abonnement actif tel qu'exposé par /me.
export interface AbonnementResume {
  actif: boolean;
  date_fin: string | null;
  plan: { nom: string; duree_mois: number } | null;
}
