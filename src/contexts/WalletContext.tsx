import React, { createContext, useState } from "react";
import { Transaction } from "@/types";

const INITIAL_BALANCE = 25000;

// TODO: remplacer par les données réelles du wallet une fois l'API disponible.
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "TX-1",
    type: "recharge",
    label: "Rechargement",
    amount: 20000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    method: "Orange Money",
  },
  {
    id: "TX-2",
    type: "paiement",
    label: "Billet Dakar ↔ Île de Gorée",
    amount: -3000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    method: "Wallet",
  },
];

interface WalletContextValue {
  balance: number;
  transactions: Transaction[];
  recharge: (amount: number, method: string) => void;
  pay: (amount: number, label: string) => boolean;
}

export const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  function recharge(amount: number, method: string) {
    setBalance((prev) => prev + amount);
    setTransactions((prev) => [
      {
        id: `TX-${Date.now()}`,
        type: "recharge",
        label: "Rechargement",
        amount,
        date: new Date().toISOString(),
        method,
      },
      ...prev,
    ]);
  }

  function pay(amount: number, label: string) {
    if (amount > balance) return false;
    setBalance((prev) => prev - amount);
    setTransactions((prev) => [
      {
        id: `TX-${Date.now()}`,
        type: "paiement",
        label,
        amount: -amount,
        date: new Date().toISOString(),
        method: "Wallet",
      },
      ...prev,
    ]);
    return true;
  }

  return (
    <WalletContext.Provider value={{ balance, transactions, recharge, pay }}>
      {children}
    </WalletContext.Provider>
  );
}
