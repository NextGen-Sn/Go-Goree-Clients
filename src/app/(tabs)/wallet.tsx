import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  AppState,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { colors, gradients } from "@/constants/theme";
import { usePortefeuille, useMouvements, MOUVEMENTS_QUERY_KEY } from "@/hooks/usePortefeuille";
import { portefeuilleService, RechargeMode } from "@/services/portefeuille.service";
import { formatFcfa } from "@/constants/trip";
import { formatApiError } from "@/utils/apiError";
import { RechargeModal } from "@/components/RechargeModal";
import { MouvementPortefeuille } from "@/types/wallet";

const QUICK_AMOUNTS = [2000, 5000, 10000, 20000];
const RECHARGE_POLL_MS = 3000;
const RECHARGE_TIMEOUT_MS = 60_000;

const RECHARGE_MODE_MAP: Record<"wave" | "orange" | "yas", RechargeMode> = {
  wave: "WAVE",
  orange: "ORANGE_MONEY",
  yas: "YAS",
};

type PendingRecharge = {
  previousSolde: number;
  startedAt: number;
};

function formatMouvementDate(iso: string, t: any, locale: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) {
    return t("wallet.dateToday", { time });
  }
  return `${date.toLocaleDateString(locale)}, ${time}`;
}

function MouvementRow({ mouvement, last }: { mouvement: MouvementPortefeuille; last: boolean }) {
  const { t, i18n } = useTranslation();
  const isRecharge = mouvement.type === "RECHARGE";
  const isPending = mouvement.statut === "EN_ATTENTE";
  const isRejected = mouvement.statut === "REJETE";
  const amount = Number(mouvement.montant);

  const label = mouvement.type_transaction
    ? t(`wallet.transactionType_${mouvement.type_transaction}`, { defaultValue: mouvement.type_transaction })
    : (isRecharge ? t("wallet.transactionType_RECHARGE_PORTEFEUILLE") : t("wallet.transactionType_DEBIT"));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isRecharge ? "#DCFCE7" : colors.primaryTint,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons
          name={isRecharge ? "arrow-down" : "boat"}
          size={18}
          color={isRecharge ? "#16A34A" : colors.primary}
        />
      </View>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textDark }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textGray, marginTop: 2 }}>
          {mouvement.mode ? `${mouvement.mode} • ` : ""}
          {formatMouvementDate(mouvement.created_at, t, i18n.language)}
          {isPending
            ? ` • ${t("wallet.transactionStatus_pending")}`
            : isRejected
            ? ` • ${t("wallet.transactionStatus_rejected")}`
            : ""}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "800",
          color: isRejected ? colors.textGray : isRecharge ? "#16A34A" : colors.primary,
          textDecorationLine: isRejected ? "line-through" : "none",
        }}
      >
        {isRecharge ? "+" : "-"}
        {formatFcfa(amount)}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const { t } = useTranslation();
  const { data: portefeuille, isLoading, isError, refetch, isRefetching } = usePortefeuille();
  const { data: mouvements, isLoading: mouvementsLoading } = useMouvements();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [presetAmount, setPresetAmount] = useState<number | null>(null);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [rechargeError, setRechargeError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingRecharge | null>(null);
  const [justCredited, setJustCredited] = useState(false);
  const rechargingRef = useRef(false);

  const balance = portefeuille ? Number(portefeuille.solde) : null;
  const pendingTimedOut = pending !== null && Date.now() - pending.startedAt > RECHARGE_TIMEOUT_MS;

  useEffect(() => {
    if (!pending || pendingTimedOut) return;
    const interval = setInterval(() => refetch(), RECHARGE_POLL_MS);
    return () => clearInterval(interval);
  }, [pending, pendingTimedOut]);

  useEffect(() => {
    if (!pending) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refetch();
    });
    return () => sub.remove();
  }, [pending]);

  useEffect(() => {
    if (pending && balance !== null && balance !== pending.previousSolde) {
      setPending(null);
      setJustCredited(true);
      queryClient.invalidateQueries({ queryKey: MOUVEMENTS_QUERY_KEY });
      const timer = setTimeout(() => setJustCredited(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [balance, pending]);

  function refreshAll() {
    refetch();
    queryClient.invalidateQueries({ queryKey: MOUVEMENTS_QUERY_KEY });
  }

  async function handleConfirmRecharge(amount: number, methodId: string) {
    if (rechargingRef.current) return;
    rechargingRef.current = true;
    setRechargeError(null);
    setModalVisible(false);
    try {
      const mode = RECHARGE_MODE_MAP[methodId as "wave" | "orange" | "yas"] ?? "PAYDUNYA";
      const { redirectUrl } = await portefeuilleService.recharge(amount, mode);
      setPending({ previousSolde: balance ?? 0, startedAt: Date.now() });
      if (redirectUrl) {
        await WebBrowser.openBrowserAsync(redirectUrl);
        refetch();
      }
    } catch (err) {
      setRechargeError(formatApiError(err));
      setPending(null);
    } finally {
      rechargingRef.current = false;
    }
  }

  function openRecharge(amount: number | null) {
    setPresetAmount(amount);
    setModalVisible(true);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.white, marginBottom: 20 }}>
              {t("wallet.title")}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  color: "rgba(255,255,255,0.8)",
                  marginRight: 8,
                }}
              >
                {t("wallet.availableBalance")}
              </Text>
              <Pressable onPress={() => setBalanceHidden((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={balanceHidden ? "eye-off-outline" : "eye-outline"}
                  size={15}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={{ height: 40, justifyContent: "center", marginBottom: 20 }}>
                <ActivityIndicator color={colors.white} />
              </View>
            ) : (
              <Text style={{ fontSize: 32, fontWeight: "800", color: colors.white, marginBottom: 20 }}>
                {isError || balance === null
                  ? "— FCFA"
                  : balanceHidden
                    ? "•••• FCFA"
                    : formatFcfa(balance)}
              </Text>
            )}

            <Pressable onPress={() => openRecharge(null)}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.22)",
                  borderRadius: 26,
                  height: 48,
                }}
              >
                <Ionicons name="add" size={18} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.white }}>
                  {t("wallet.recharge")}
                </Text>
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refreshAll} tintColor={colors.primary} />
        }
      >
        {isError ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FEE2E2",
              borderRadius: 14,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontSize: 13, color: "#991B1B" }}>
              {t("wallet.errorLoading")}
            </Text>
          </View>
        ) : null}

        {rechargeError ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FEE2E2",
              borderRadius: 14,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontSize: 13, color: "#991B1B" }}>{rechargeError}</Text>
            <Pressable onPress={() => setRechargeError(null)} hitSlop={8}>
              <Ionicons name="close" size={18} color="#991B1B" />
            </Pressable>
          </View>
        ) : null}

        {pending ? (
          <View
            style={{
              backgroundColor: "#FEF3C7",
              borderRadius: 14,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Ionicons name="time-outline" size={20} color="#D97706" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: "700", color: "#92400E" }}>
                {pendingTimedOut ? t("wallet.pendingRechargeTitle_timedOut") : t("wallet.pendingRechargeTitle")}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: "#92400E", marginBottom: 10 }}>
              {pendingTimedOut ? t("wallet.pendingRechargeSubtitle_timedOut") : t("wallet.pendingRechargeSubtitle")}
            </Text>
            <View style={{ flexDirection: "row" }}>
              <Pressable
                onPress={() => refetch()}
                style={{
                  paddingHorizontal: 14,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "#D97706",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.white }}>
                  {t("wallet.verifyNow")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setPending(null)}
                style={{
                  paddingHorizontal: 14,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#92400E" }}>{t("wallet.hide")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {justCredited ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#DCFCE7",
              borderRadius: 14,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: "700", color: "#166534" }}>
              {t("wallet.credited")}
            </Text>
          </View>
        ) : null}

        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textDark, marginBottom: 12 }}>
          {t("wallet.quickAmounts")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 24 }}>
          {QUICK_AMOUNTS.map((value) => (
            <Pressable
              key={value}
              onPress={() => openRecharge(value)}
              style={{
                paddingHorizontal: 16,
                height: 38,
                borderRadius: 19,
                borderWidth: 1.5,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textDark }}>
                {formatFcfa(value)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textDark, marginBottom: 12 }}>
          {t("wallet.recentTransactions")}
        </Text>
        {mouvementsLoading ? (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !mouvements || mouvements.length === 0 ? (
          <Text style={{ fontSize: 14, color: colors.textGray, marginTop: 8 }}>
            {t("wallet.noTransactions")}
          </Text>
        ) : (
          mouvements.map((m, i) => (
            <MouvementRow key={m.id} mouvement={m} last={i === mouvements.length - 1} />
          ))
        )}
      </ScrollView>

      <RechargeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmRecharge}
        initialAmount={presetAmount}
      />
    </View>
  );
}
