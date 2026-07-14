import { useContext } from "react";
import { WalletContext } from "@/contexts/WalletContext";

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet doit être utilisé dans un WalletProvider");
  }
  return context;
}
