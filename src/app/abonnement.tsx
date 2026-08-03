import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useTranslation } from "react-i18next";
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

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Nombre de jours entiers restants avant l'expiration.
 *
 * Comparaison de dates calendaires, pas d'horodatages : un abonnement qui
 * expire ce soir doit afficher « dernier jour », pas « 0 jour » au motif qu'il
 * reste moins de 24 heures.
 */
function joursRestants(iso: string): number {
  const jour = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = jour(new Date(iso)) - jour(new Date());
  return Math.max(0, Math.round(diff / 86_400_000));
}

export default function AbonnementScreen() {
  const { t, i18n } = useTranslation();
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
        {t("subscription.title")}
      </Text>
    </View>
  );

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
            {t("subscription.active")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginBottom: 8 }}>
            {ab.plan ? ab.plan.nom : t("subscription.active")}
          </Text>
          {ab.dateFin ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  justifyContent: "center",
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontSize: 34, fontWeight: "800", color: "#16A34A" }}>
                  {joursRestants(ab.dateFin)}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textDark, marginLeft: 6 }}>
                  {t("subscription.daysLeft", { count: joursRestants(ab.dateFin) })}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textGray, textAlign: "center", marginBottom: 24 }}>
                {t("subscription.expiresOn", { date: formatDate(ab.dateFin, i18n.language) })}
              </Text>
            </>
          ) : null}
          <View style={{ backgroundColor: colors.primaryTint, borderRadius: 14, padding: 16 }}>
            <Text style={{ fontSize: 13, color: colors.primary, textAlign: "center", fontWeight: "600" }}>
              {t("subscription.freeTicketsBenefit")}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!estResident) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
        {header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Ionicons name="id-card-outline" size={48} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textDark, marginBottom: 8, textAlign: "center" }}>
            {t("subscription.residentOnlyTitle")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginBottom: 28 }}>
            {t("subscription.residentOnlySubtitle")}
          </Text>
          <Pressable onPress={() => router.replace("/demande-carte-resident")} style={{ width: "100%" }}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>{t("subscription.requestCardBtn")}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (pendingSince !== null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
        {header}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Ionicons name="time-outline" size={48} color="#D97706" />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textDark, marginBottom: 8, textAlign: "center" }}>
            {pendingTimedOut ? t("subscription.pendingActivationTitle_timedOut") : t("subscription.pendingActivationTitle")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginBottom: 28 }}>
            {pendingTimedOut
              ? t("subscription.pendingActivationSubtitle_timedOut")
              : t("subscription.pendingActivationSubtitle")}
          </Text>
          <Pressable onPress={() => refreshUser()} style={{ width: "100%", marginBottom: 12 }}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>{t("subscription.verifyNow")}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => setPendingSince(null)}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textGray }}>{t("subscription.hide")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId) ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {header}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark, marginBottom: 4 }}>
          {t("subscription.choosePlan")}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textGray, marginBottom: 16 }}>
          {t("subscription.activePlanBenefit")}
        </Text>

        {isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <Pressable onPress={() => refetch()} style={{ paddingVertical: 16 }}>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "700" }}>
              {t("subscription.errorLoadingPlans")}
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
                    {t("subscription.months", { count: plan.duree_mois })}
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
              {t("subscription.paymentMethod")}
            </Text>
            {PAYMENT_OPTIONS.map((opt) => {
              const selected = mode === opt.id;
              const paymentLabel = opt.id === "PORTEFEUILLE" ? t("subscription.walletPay") : opt.label;
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
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.textDark }}>{paymentLabel}</Text>
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
                ? t("subscription.processing")
                : selectedPlan
                  ? t("subscription.subscribeWithPrice", { price: formatFcfa(Number(selectedPlan.prix)) })
                  : t("subscription.choosePlanPlaceholder")}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
