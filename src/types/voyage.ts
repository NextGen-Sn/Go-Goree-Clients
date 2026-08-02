export type JourSemaine =
  | "LUNDI"
  | "MARDI"
  | "MERCREDI"
  | "JEUDI"
  | "VENDREDI"
  | "SAMEDI"
  | "DIMANCHE";

export interface Trajet {
  id: string;
  jour: JourSemaine;
  heure_depart: string; // "HH:mm:ss"
  duree: string; // heures, décimal Laravel sérialisé en string (ex. "20.00")
}

export interface Chaloupe {
  id: string;
  imatriculation: string;
  nom: string;
  capacite: number;
  statut: string;
}

export interface Voyage {
  id: string;
  date_voyage: string; // "YYYY-MM-DD"
  places: number;
  places_restantes: number;
  // Nullables : VoyageResource renvoie ces relations telles quelles, et elles
  // valent null si l'entité a été supprimée côté admin. Les déclarer non
  // nullables a déjà coûté un plantage de la liste des billets.
  trajet: Trajet | null;
  chaloupe: Chaloupe | null;
  created_at: string;
}

export interface TripSelection {
  voyage: Voyage;
  dateLabel: string;
  timeLabel: string;
}
