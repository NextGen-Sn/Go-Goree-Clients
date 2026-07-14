export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export type TicketStatus = "valide" | "utilisé" | "expiré";

export interface Ticket {
  id: string;
  departure: string;
  destination: string;
  dateLabel: string;
  passengersLabel: string;
  total: number;
  purchasedAt: string;
  status: TicketStatus;
}
