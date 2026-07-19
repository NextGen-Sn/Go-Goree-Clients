import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "@/constants/config";
import { storage } from "@/utils/storage";

export class ApiError extends Error {
  status?: number;
  errors?: Record<string, string[]>;
  retryAfter?: number;

  constructor(
    message: string,
    opts: { status?: number; errors?: Record<string, string[]>; retryAfter?: number } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.errors = opts.errors;
    this.retryAfter = opts.retryAfter;
  }
}

/**
 * L'intercepteur n'a pas accès au router/contexte React. Pour qu'un token
 * expiré/révoqué (401 sur une route authentifiée) déclenche un logout global,
 * on passe par ce petit pub-sub : AuthProvider s'y abonne une fois au montage.
 */
type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

export const authEvents = {
  onUnauthorized(listener: Listener) {
    unauthorizedListeners.add(listener);
    return () => {
      unauthorizedListeners.delete(listener);
    };
  },
  emitUnauthorized() {
    unauthorizedListeners.forEach((listener) => listener());
  },
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    // Sans effet hors ngrok ; avec un tunnel ngrok gratuit, évite la page
    // d'avertissement interstitielle qui casserait les réponses JSON.
    "ngrok-skip-browser-warning": "true",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.get("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface BackendErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<BackendErrorBody>) => {
    // Pas de réponse du tout : backend injoignable (mauvaise IP, serveur éteint,
    // pas de réseau...). C'est le cas le plus fréquent en dev avec Expo Go.
    if (!error.response) {
      return Promise.reject(
        new ApiError(
          "Impossible de joindre le serveur. Vérifiez que le backend tourne et que l'adresse API (EXPO_PUBLIC_API_URL) est correcte.",
          {}
        )
      );
    }

    const { status, data, headers } = error.response;
    const backendMessage = data?.message;
    const requestHadToken = Boolean(
      (error.config?.headers as Record<string, unknown> | undefined)?.Authorization
    );

    // throttle:6,1 sur /login, /register, /password/* côté backend.
    if (status === 429) {
      const rawRetryAfter = headers?.["retry-after"];
      const retryAfter = rawRetryAfter ? Number(rawRetryAfter) : undefined;
      return Promise.reject(
        new ApiError(
          retryAfter
            ? `Trop de tentatives. Réessayez dans ${retryAfter}s.`
            : "Trop de tentatives. Réessayez dans un instant.",
          { status, retryAfter }
        )
      );
    }

    if (status === 401) {
      // 401 avec un token présent = session expirée/révoquée -> logout global.
      // 401 sans token = simple échec de /login (mauvais identifiants) : on ne
      // touche pas au token ni à l'état global, l'écran affiche juste l'erreur.
      if (requestHadToken) {
        await storage.remove("auth_token");
        authEvents.emitUnauthorized();
      }
      return Promise.reject(
        new ApiError(
          backendMessage ?? (requestHadToken ? "Session expirée, veuillez vous reconnecter." : "Identifiants invalides."),
          { status }
        )
      );
    }

    if (status === 422) {
      return Promise.reject(
        new ApiError(backendMessage ?? "Certaines informations sont invalides.", {
          status,
          errors: data?.errors,
        })
      );
    }

    return Promise.reject(new ApiError(backendMessage ?? "Une erreur est survenue.", { status }));
  }
);
