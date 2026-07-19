import React, { createContext, useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService, LoginPayload, RegisterPayload } from "@/services/auth.service";
import { storage } from "@/utils/storage";
import { authEvents } from "@/api/client";
import { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ME_QUERY_KEY = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // null = "pas encore vérifié" (lecture async du SecureStore au boot).
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const token = await storage.get("auth_token");
      setHasToken(Boolean(token));
    })();
  }, []);

  // Déclenché par l'intercepteur axios sur un 401 avec token (session
  // expirée/révoquée côté serveur) : on retombe sur l'écran de login.
  useEffect(() => {
    return authEvents.onUnauthorized(() => {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      setHasToken(false);
    });
  }, [queryClient]);

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authService.me,
    enabled: hasToken === true,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) {
      // Token présent mais /me échoue quand même (backend redémarré,
      // token révoqué...) : ne pas rester bloqué sur un loader infini.
      setHasToken(false);
    }
  }, [meQuery.isError]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async ({ user, token }) => {
      await storage.set("auth_token", token);
      queryClient.setQueryData(ME_QUERY_KEY, user);
      setHasToken(true);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: async ({ user, token }) => {
      await storage.set("auth_token", token);
      queryClient.setQueryData(ME_QUERY_KEY, user);
      setHasToken(true);
    },
  });

  const logout = useCallback(async () => {
    try {
      if (hasToken) {
        await authService.logout();
      }
    } catch {
      // Le token est peut-être déjà invalide côté serveur : on nettoie quand même localement.
    } finally {
      await storage.remove("auth_token");
      queryClient.setQueryData(ME_QUERY_KEY, null);
      setHasToken(false);
    }
  }, [hasToken, queryClient]);

  const value: AuthContextValue = {
    user: meQuery.data ?? null,
    isLoading: hasToken === null || (hasToken === true && meQuery.isPending),
    login: async (payload) => {
      await loginMutation.mutateAsync(payload);
    },
    register: async (payload) => {
      await registerMutation.mutateAsync(payload);
    },
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
