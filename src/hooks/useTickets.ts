import { useContext } from "react";
import { TicketsContext } from "@/contexts/TicketsContext";

export function useTickets() {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error("useTickets doit être utilisé dans un TicketsProvider");
  }
  return context;
}
