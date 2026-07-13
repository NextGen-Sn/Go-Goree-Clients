import axios from "axios";
import { API_BASE_URL } from "@/constants/config";
import { storage } from "@/utils/storage";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await storage.get("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? "Erreur inconnue";
    return Promise.reject({ message, status: error.response?.status });
  }
);
