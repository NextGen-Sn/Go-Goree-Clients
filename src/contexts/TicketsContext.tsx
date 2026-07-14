import React, { createContext, useState } from "react";
import { Ticket } from "@/types";

type NewTicket = Omit<Ticket, "id" | "purchasedAt" | "status">;

interface TicketsContextValue {
  tickets: Ticket[];
  addTicket: (data: NewTicket) => Ticket;
  getTicket: (id: string) => Ticket | undefined;
}

export const TicketsContext = createContext<TicketsContextValue | undefined>(undefined);

export function TicketsProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  function addTicket(data: NewTicket) {
    const ticket: Ticket = {
      ...data,
      id: `GG-${Date.now().toString(36).toUpperCase()}`,
      purchasedAt: new Date().toISOString(),
      status: "valide",
    };
    setTickets((prev) => [ticket, ...prev]);
    return ticket;
  }

  function getTicket(id: string) {
    return tickets.find((t) => t.id === id);
  }

  return (
    <TicketsContext.Provider value={{ tickets, addTicket, getTicket }}>
      {children}
    </TicketsContext.Provider>
  );
}
