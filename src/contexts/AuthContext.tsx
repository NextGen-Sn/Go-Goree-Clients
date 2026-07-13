import React, { createContext, useEffect, useState } from "react";
import { authService, LoginPayload } from "@/services/auth.service";
import { storage } from "@/utils/storage";
import { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await storage.get("auth_token");
      if (token) {
        try {
          const me = await authService.me();
          setUser(me);
        } catch {
          await storage.remove("auth_token");
        }
      }
      setIsLoading(false);
    })();
  }, []);

  async function login(payload: LoginPayload) {
    const { user: loggedInUser, token } = await authService.login(payload);
    await storage.set("auth_token", token);
    setUser(loggedInUser);
  }

  async function logout() {
    await authService.logout();
    await storage.remove("auth_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
