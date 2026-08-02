import { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { colors, gradients } from "@/constants/theme";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/hooks/useAuth";
import { useDemandesResidence, DEMANDES_RESIDENCE_QUERY_KEY } from "@/hooks/useDemandesResidence";
import { residentService, UploadFile } from "@/services/resident.service";
import { pickImageFromCamera, pickImageFromLibrary, pickDocument } from "@/utils/pickFile";
import { formatApiError } from "@/utils/apiError";
import { DemandeResidence } from "@/types/resident";

const STATUT_META: Record<
  DemandeResidence["statut"],
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; labelKey: string }
> = {
  EN_COURS: { icon: "time", color: "#D97706", bg: "#FEF3C7", labelKey: "resident.statusExam" },
  ACCEPTEE: { icon: "checkmark-circle", color: "#16A34A", bg: "#DCFCE7", labelKey: "resident.statusApproved" },
  REFUSEE: { icon: "close-circle", color: "#DC2626", bg: "#FEE2E2", labelKey: "resident.statusRejected" },
  ANNULEE: { icon: "ban", color: colors.textGray, bg: colors.inputBg, labelKey: "resident.statusCancelled" },
};

function DocumentSlot({
  label,
  hint,
  file,
  allowDocument,
  onPick,
}: {
  label: string;
  hint: string;
  file: UploadFile | null;
  allowDocument: boolean;
  onPick: (f: UploadFile) => void;
}) {
  const { t } = useTranslation();

  async function run(picker: () => Promise<UploadFile | null>) {
    const f = await picker();
    if (f) onPick(f);
  }

  function openOptions() {
    const buttons: { text: string; onPress?: () => void; style?: "cancel" }[] = [
      { text: t("resident.pickOptionCamera"), onPress: () => run(pickImageFromCamera) },
      { text: t("resident.pickOptionLibrary"), onPress: () => run(pickImageFromLibrary) },
    ];
    if (allowDocument) buttons.push({ text: t("resident.pickOptionFile"), onPress: () => run(pickDocument) });
    buttons.push({ text: t("common.cancel"), style: "cancel" });
    Alert.alert(label, t("resident.pickPhotoTitle"), buttons);
  }

  const isImage = file?.mimeType.startsWith("image/");

  return (
    <Pressable
      onPress={openOptions}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: file ? colors.primary : colors.border,
      }}
    >
      {file && isImage ? (
        <Image source={{ uri: file.uri }} style={{ width: 42, height: 42, borderRadius: 12, marginRight: 14 }} />
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
          <Ionicons name={file ? "document-text" : "cloud-upload-outline"} size={20} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark }}>{label}</Text>
        <Text style={{ fontSize: 12, color: file ? colors.primary : colors.textGray, marginTop: 2 }} numberOfLines={1}>
          {file ? file.name : hint}
        </Text>
      </View>
      <Ionicons name={file ? "checkmark-circle" : "chevron-forward"} size={18} color={file ? "#16A34A" : colors.textGray} />
    </Pressable>
  );
}

export default function DemandeCarteResidentScreen() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: demandes, isLoading } = useDemandesResidence();

  const [carteIdentite, setCarteIdentite] = useState("");
  const [residence, setResidence] = useState("");
  const [photo, setPhoto] = useState<UploadFile | null>(null);
  const [cniRecto, setCniRecto] = useState<UploadFile | null>(null);
  const [cniVerso, setCniVerso] = useState<UploadFile | null>(null);
  const [certificat, setCertificat] = useState<UploadFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const derniereDemande = useMemo(() => {
    if (!demandes || demandes.length === 0) return null;
    return [...demandes].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  }, [demandes]);

  const enCours = derniereDemande?.statut === "EN_COURS";
  const estAccepte = user?.estResident || derniereDemande?.statut === "ACCEPTEE";
  const refusee = derniereDemande?.statut === "REFUSEE";

  async function handleSubmit() {
    setError(null);
    if (!carteIdentite.trim()) return setError(t("resident.errorIdCardRequired"));
    if (!residence.trim()) return setError(t("resident.errorResidenceRequired"));
    if (!photo) return setError(t("resident.errorPhotoRequired"));

    setSubmitting(true);
    try {
      await residentService.submitDemande({
        carteIdentite: carteIdentite.trim(),
        residence: residence.trim(),
        photo,
        cniRecto,
        cniVerso,
        certificatResidence: certificat,
      });
      await queryClient.invalidateQueries({ queryKey: DEMANDES_RESIDENCE_QUERY_KEY });
      await refreshUser();
      Alert.alert(t("resident.successTitle"), t("resident.successMessage"));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const header = (
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
        {t("resident.headerTitle")}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
        {header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (estAccepte || enCours) {
    const meta = estAccepte ? STATUT_META.ACCEPTEE : STATUT_META.EN_COURS;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
        {header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: meta.bg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Ionicons name={meta.icon} size={48} color={meta.color} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textDark, marginBottom: 8, textAlign: "center" }}>
            {estAccepte ? t("resident.isResidentTitle") : t("resident.statusExam")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginBottom: 28 }}>
            {estAccepte
              ? t("resident.isResidentSubtitle")
              : t("resident.pendingSubtitle")}
          </Text>
          {estAccepte && (
            <Pressable onPress={() => router.push("/abonnement")} style={{ width: "100%" }}>
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>
                  {t("resident.viewSubscriptions")}
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {header}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 16 }}>
        {refusee && derniereDemande?.motif_refus ? (
          <View style={{ backgroundColor: "#FEE2E2", borderRadius: 14, padding: 14, marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#991B1B", marginBottom: 4 }}>
              {t("resident.previousRejected")}
            </Text>
            <Text style={{ fontSize: 13, color: "#991B1B" }}>{t("resident.previousRejectedReason", { reason: derniereDemande.motif_refus })}</Text>
          </View>
        ) : null}

        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: 14 }}>
          {t("resident.yourInfo")}
        </Text>
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>{t("resident.idCardNumber")}</Text>
          <TextField
            icon="card-outline"
            placeholder={t("resident.idCardPlaceholder")}
            value={carteIdentite}
            onChangeText={setCarteIdentite}
          />
        </View>
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.label}>{t("resident.residenceAddress")}</Text>
          <TextField
            icon="home-outline"
            placeholder={t("resident.residencePlaceholder")}
            value={residence}
            onChangeText={setResidence}
          />
        </View>

        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: 4 }}>
          {t("resident.documents")}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textGray, marginBottom: 14 }}>
          {t("resident.documentsHint")}
        </Text>

        <DocumentSlot
          label={t("resident.photoId")}
          hint={t("resident.photoIdHint")}
          file={photo}
          allowDocument={false}
          onPick={setPhoto}
        />
        <DocumentSlot
          label={t("resident.cniRecto")}
          hint={t("resident.cniRectoHint")}
          file={cniRecto}
          allowDocument
          onPick={setCniRecto}
        />
        <DocumentSlot
          label={t("resident.cniVerso")}
          hint={t("resident.cniRectoHint")}
          file={cniVerso}
          allowDocument
          onPick={setCniVerso}
        />
        <DocumentSlot
          label={t("resident.certificatResidence")}
          hint={t("resident.cniRectoHint")}
          file={certificat}
          allowDocument
          onPick={setCertificat}
        />

        {error ? <Text style={{ color: "#DC2626", fontSize: 13, marginTop: 8 }}>{error}</Text> : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable onPress={handleSubmit} disabled={submitting}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", opacity: submitting ? 0.7 : 1 }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>
              {submitting ? t("resident.submitting") : t("resident.submitBtn")}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textDark,
    marginBottom: 6,
  },
};
