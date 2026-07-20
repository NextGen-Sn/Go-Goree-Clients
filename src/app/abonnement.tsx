import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { colors, gradients } from "@/constants/theme";
import { formatFcfa } from "@/constants/trip";
import { useAuth } from "@/hooks/useAuth";
import { usePlans } from "@/hooks/usePlans";
import { abonnementService, SouscriptionMode } from "@/services/abonnement.service";
import { formatApiError } from "@/utils/apiError";
import { Plan } from "@/types/resident";

const PAYMENT_OPTIONS: { id: SouscriptionMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "PORTEFEUILLE", label: "Portefeuille GO GOREE", icon: "wallet" },
  { id: "WAVE", label: "Wave", icon: "phone-portrait-outline" },
  { id: "ORANGE_MONEY", label: "Orange Money", icon: "phone-portrait-outline" },
  { id: "YAS", label: "Yas", icon: "phone-portrait-outline" },
];

const POLL_MS = 3000;
const TIMEOUT_MS = 60_000;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function AbonnementScreen() {
  const { user, refreshUser } = useAuth();
  const { data: plans, isLoading, isError, refetch } = usePlans();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [mode, setMode] = useState<SouscriptionMode>("PORTEFEUILLE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSince, setPendingSince] = useState<number | null>(null);
  const submittingRef = useRef(false);

  const abonnementActif = user?.abonnement?.actif ?? false;
  const estResident = user?.estResident ?? false;
  const pendingTimedOut = pendingSince !== null && Date.now() - pendingSince > TIMEOUT_MS;

  // Après un paiement PayDunya, on interroge /me jusqu'à ce que l'abonnement
  // devienne actif (webhook traité côté backend).
  useEffect(() => {
    if (pendingSince === null || pendingTimedOut) return;
    const interval = setInterval(() => refreshUser(), POLL_MS);
    return () => clearInterval(interval);
  }, [pendingSince, pendingTimedOut, refreshUser]);

  useEffect(() => {
    if (pendingSince === null) return;
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refreshUser();
    });
    return () => sub.remove();
  }, [pendingSince, refreshUser]);

  // Abonnement devenu actif : on sort de l'état "en attente".
  useEffect(() => {
    if (pendingSince !== null && abonnementActif) setPendingSince(null);
  }, [abonnementActif, pendingSince]);

  async function handleSouscrire() {
    if (submittingRef.current || !selectedPlanId) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const { activatedImmediately, redirectUrl } = await abonnementService.souscrire(selectedPlanId, mode);
      if (activatedImmediately) {
        await refreshUser();
      } else if (redirectUrl) {
        setPendingSince(Date.now());
        await WebBrowser.openBrowserAsync(redirectUrl);
        refreshUser();
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const header = (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
      <Pressable onPress={() => router.canGoBack() && router.back()} hitSlop={12}>
        <Ionicons name="chevron-back" size={26} color={colors.textDark} />
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textDark, marginLeft: 12 }}>
        Mon abonnement
      </Text>
    </View>
  );

  // Abonnement actif : carte de statut, pas de souscription.
  if (abonnementActif) {
    const ab = user!.abonnement!;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
        {header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Ionicons name="ribbon" size={48} color="#16A34A" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textDark, marginBottom: 8 }}>
            Abonnement actif
          </Text>
          <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginBottom: 8 }}>
            {ab.plan ? ab.plan.nom : "Abonnement résident"}
          </Text>
          {ab.dateFin ? (
            <Text style={{ fontSize: 14, color: colors.textDark, textAlign: "center", marginBottom: 24 }}>
              Valable jusqu'au {formatDate(ab.dateFin)}
            </Text>
          ) : null}
          <View style={{ backgroundColor: colors.primaryTint, borderRadius: 14, padding: 16 }}>
            <Text style={{ fontSize: 13, color: colors.primary, textAlign: "center", fontWeight: "600" }}>
              Vos billets sont gratuits sur tous les voyages tant que votre abonnement est actif.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Non-résident : rediriger vers la demande de carte.
  if (!estResident) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
        {header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Ionicons name="id-card-outline" size={48} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textDark, marginBottom: 8, textAlign: "center" }}>
            Réservé aux résidents
          </Text>
          <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginBottom: 28 }}>
            Les abonnements sont réservés aux résidents de Gorée. Soumettez d'abord votre demande de carte résident.
          </Text>
          <Pressable onPress={() => router.replace("/demande-carte-resident")} style={{ width: "100%" }}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>Demander la carte résident</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Paiement PayDunya en attente de confirmation.
  if (pendingSince !== null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
        {header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Ionicons name="time-outline" size={48} color="#D97706" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textDark, marginBottom: 8, textAlign: "center" }}>
            {pendingTimedOut ? "Toujours en attente" : "Activation en cours..."}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginBottom: 28 }}>
            {pendingTimedOut
              ? "La confirmation prend plus de temps que prévu. L'abonnement s'activera dès la validation du paiement."
              : "Nous confirmons votre paiement avec Paydunya. Votre abonnement sera activé dans un instant."}
          </Text>
          <Pressable onPress={() => refreshUser()} style={{ width: "100%", marginBottom: 12 }}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>Vérifier maintenant</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => setPendingSince(null)}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textGray }}>Masquer</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Résident sans abonnement : liste des plans + souscription.
  const selectedPlan = plans?.find((p) => p.id === selectedPlanId) ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {header}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: 4 }}>
          Choisissez une formule
        </Text>
        <Text style={{ fontSize: 12, color: colors.textGray, marginBottom: 16 }}>
          Un abonnement actif rend vos billets gratuits sur tous les voyages.
        </Text>

        {isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <Pressable onPress={() => refetch()} style={{ paddingVertical: 16 }}>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "700" }}>
              Impossible de charger les formules. Réessayer.
            </Text>
          </Pressable>
        ) : (
          (plans ?? []).map((plan: Plan) => {
            const selected = selectedPlanId === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlanId(plan.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primaryTint : colors.white,
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark }}>{plan.nom}</Text>
                  <Text style={{ fontSize: 12, color: colors.textGray, marginTop: 2 }}>
                    {plan.duree_mois} mois
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary, marginRight: 12 }}>
                  {formatFcfa(Number(plan.prix))}
                </Text>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, alignItems: "center", justifyContent: "center" }}>
                  {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                </View>
              </Pressable>
            );
          })
        )}

        {selectedPlan ? (
          <>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark, marginTop: 12, marginBottom: 12 }}>
              Mode de paiement
            </Text>
            {PAYMENT_OPTIONS.map((opt) => {
              const selected = mode === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setMode(opt.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primaryTint : colors.white,
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name={opt.icon} size={20} color={colors.primary} style={{ marginRight: 12 }} />
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.textDark }}>{opt.label}</Text>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? colors.primary : colors.border, alignItems: "center", justifyContent: "center" }}>
                    {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                  </View>
                </Pressable>
              );
            })}
          </>
        ) : null}

        {error ? <Text style={{ color: "#DC2626", fontSize: 13, marginTop: 8 }}>{error}</Text> : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Pressable onPress={handleSouscrire} disabled={!selectedPlan || submitting}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", opacity: !selectedPlan || submitting ? 0.5 : 1 }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>
              {submitting
                ? "Traitement…"
                : selectedPlan
                  ? `Souscrire — ${formatFcfa(Number(selectedPlan.prix))}`
                  : "Choisir une formule"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
