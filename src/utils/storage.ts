import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const webStorage = {
  async get(key: string) {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  },
  async set(key: string, value: string) {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
  async remove(key: string) {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  },
};

const nativeStorage = {
  async get(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};

export const storage = Platform.OS === "web" ? webStorage : nativeStorage;
