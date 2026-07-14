import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { colors, gradients } from "@/constants/theme";

type DocStatus = "validated" | "pending" | "required";

interface DocItem {
  id: string;
  label: string;
  status: DocStatus;
  uri?: string;
}

const STATUS_META: Record<
  DocStatus,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  validated: { icon: "checkmark-circle", color: "#16A34A", label: "Validé" },
  pending: { icon: "time", color: "#D97706", label: "En attente" },
  required: { icon: "arrow-up-circle", color: colors.primary, label: "À soumettre" },
};

const INITIAL_DOCS: DocItem[] = [
  { id: "cni", label: "Carte nationale d'identité", status: "validated" },
  { id: "certificat_residence", label: "Certificat de résidence", status: "pending" },
  { id: "photo_identite", label: "Photo d'identité", status: "required" },
];

export default function DemandeCarteResidentScreen() {
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);
  const canSubmit = docs.every((d) => d.status !== "required");

  async function pickFromCamera(id: string) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Caméra indisponible",
        "Autorisez l'accès à la caméra dans les réglages pour photographier ce document."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      applyUpload(id, result.assets[0].uri);
    }
  }

  async function pickFromLibrary(id: string) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Galerie indisponible",
        "Autorisez l'accès à vos photos dans les réglages pour envoyer ce document."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      applyUpload(id, result.assets[0].uri);
    }
  }

  function applyUpload(id: string, uri: string) {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "pending", uri } : d))
    );
  }

  function handleDocPress(doc: DocItem) {
    if (doc.status === "validated") return;
    Alert.alert(doc.label, "Comment souhaitez-vous ajouter ce document ?", [
      { text: "Prendre une photo", onPress: () => pickFromCamera(doc.id) },
      { text: "Choisir dans la galerie", onPress: () => pickFromLibrary(doc.id) },
      { text: "Annuler", style: "cancel" },
    ]);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    Alert.alert("Demande envoyée", "Votre demande de carte résident a été soumise avec succès.", [
      { text: "OK", onPress: () => router.canGoBack() && router.back() },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <Pressable onPress={() => router.canGoBack() && router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.textDark} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textDark, marginLeft: 12 }}>
          Demande carte résident
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 20 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: 14 }}>
          Documents requis
        </Text>

        {docs.map((doc, i) => {
          const meta = STATUS_META[doc.status];
          const locked = doc.status === "validated";
          return (
            <Pressable
              key={doc.id}
              onPress={() => handleDocPress(doc)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.white,
                borderRadius: 16,
                padding: 14,
                marginBottom: i < docs.length - 1 ? 12 : 0,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 3 },
                elevation: 2,
              }}
            >
              {doc.uri ? (
                <Image
                  source={{ uri: doc.uri }}
                  style={{ width: 42, height: 42, borderRadius: 12, marginRight: 14 }}
                />
              ) : (
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: colors.primaryTint,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark }}>
                  {doc.label}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <Ionicons name={meta.icon} size={14} color={meta.color} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: meta.color }}>
                    {meta.label}
                  </Text>
                </View>
              </View>
              {!locked && (
                <Ionicons name="chevron-forward" size={18} color={colors.textGray} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable onPress={handleSubmit} disabled={!canSubmit}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 54,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              opacity: canSubmit ? 1 : 0.5,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>
              Soumettre
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
