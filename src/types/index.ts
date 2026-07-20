export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  estResident: boolean;
  // Résumé de l'abonnement actif (exposé par /me). null si l'info n'est pas chargée.
  abonnement: {
    actif: boolean;
    dateFin: string | null;
    plan: { nom: string; dureeMois: number } | null;
  } | null;
}

export interface ApiError {
  message: string;
  status?: number;
}

export type TicketStatus = "en_attente" | "valide" | "utilisé" | "expiré";

export interface Ticket {
  id: string;
  qrToken: string;
  departure: string;
  destination: string;
  dateLabel: string;
  passengersLabel: string;
  total: number;
  purchasedAt: string;
  status: TicketStatus;
}

