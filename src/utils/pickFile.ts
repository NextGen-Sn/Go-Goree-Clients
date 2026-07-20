import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";
import { UploadFile } from "@/services/resident.service";

function nameFromUri(uri: string, fallback: string): string {
  const last = uri.split("/").pop();
  return last && last.includes(".") ? last : fallback;
}

export async function pickImageFromCamera(): Promise<UploadFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Caméra indisponible", "Autorisez l'accès à la caméra dans les réglages.");
    return null;
  }
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: true });
  if (res.canceled || !res.assets[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.fileName ?? nameFromUri(a.uri, "photo.jpg"), mimeType: a.mimeType ?? "image/jpeg" };
}

export async function pickImageFromLibrary(): Promise<UploadFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Galerie indisponible", "Autorisez l'accès à vos photos dans les réglages.");
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: true });
  if (res.canceled || !res.assets[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.fileName ?? nameFromUri(a.uri, "photo.jpg"), mimeType: a.mimeType ?? "image/jpeg" };
}

export async function pickDocument(): Promise<UploadFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ["image/*", "application/pdf"],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, name: a.name ?? nameFromUri(a.uri, "document"), mimeType: a.mimeType ?? "application/octet-stream" };
}
