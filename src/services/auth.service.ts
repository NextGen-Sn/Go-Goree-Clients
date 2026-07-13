import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      endpoints.auth.login,
      payload
    );
    return data;
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<User>(endpoints.auth.me);
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post(endpoints.auth.logout);
  },
};
