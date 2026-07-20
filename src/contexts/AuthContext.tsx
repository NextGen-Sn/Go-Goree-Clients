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
  // Recharge /me (ex. après souscription d'abonnement) pour rafraîchir le
  // statut résident et l'abonnement actif portés par `user`.
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const ME_QUERY_KEY = ["auth", "me"] as const;

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

  // La réponse de /login|/register n'inclut pas l'abonnement (relation non
  // chargée) : on seed le cache pour un affichage immédiat (nom...), puis on
  // invalide pour que /me enrichisse avec est_resident + abonnement actif.
  const seedThenRefreshMe = async (user: User, token: string) => {
    await storage.set("auth_token", token);
    queryClient.setQueryData(ME_QUERY_KEY, user);
    setHasToken(true);
    queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
  };

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: ({ user, token }) => seedThenRefreshMe(user, token),
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: ({ user, token }) => seedThenRefreshMe(user, token),
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
    refreshUser: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
