import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { unwrapResource } from "@/api/normalize";
import { User } from "@/types";

// Forme exacte renvoyée par le backend (UserResource) : champs en français,
// pas d'équivalent 1:1 avec le type `User` déjà utilisé dans le reste de l'app.
interface ApiUser {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  role?: { id: string; nom: string } | null;
}

// LoginResource désactive le wrapping Laravel ($wrap = null) : /login et /register
// renvoient cet objet brut, sans clé "data".
interface AuthResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: `${apiUser.prenom} ${apiUser.nom}`.trim(),
    email: apiUser.email,
    phone: apiUser.telephone ?? undefined,
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  passwordConfirmation: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResult> {
    const { data } = await apiClient.post<AuthResponse>(endpoints.auth.login, {
      email: payload.email,
      mot_de_passe: payload.password,
    });
    return { user: mapApiUserToUser(data.user), token: data.access_token };
  },

  async register(payload: RegisterPayload): Promise<AuthResult> {
    const { data } = await apiClient.post<AuthResponse>(endpoints.auth.register, {
      prenom: payload.firstName,
      nom: payload.lastName,
      email: payload.email,
      telephone: payload.phone || undefined,
      mot_de_passe: payload.password,
      mot_de_passe_confirmation: payload.passwordConfirmation,
    });
    return { user: mapApiUserToUser(data.user), token: data.access_token };
  },

  async me(): Promise<User> {
    // /me renvoie un JsonResource classique, wrappé dans { data: ... }.
    const { data } = await apiClient.get<{ data: ApiUser }>(endpoints.auth.me);
    return mapApiUserToUser(unwrapResource(data));
  },

  async logout(): Promise<void> {
    await apiClient.post(endpoints.auth.logout);
  },
};
