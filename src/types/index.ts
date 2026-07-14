export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export type TicketStatus = "valide" | "utilisé" | "expiré";

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

export type TransactionType = "recharge" | "paiement";

export interface Transaction {
  id: string;
  type: TransactionType;
  label: string;
  amount: number;
  date: string;
  method: string;
}
