import { useState } from "react";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { colors, gradients } from "@/constants/theme";
import { ROUTE, formatFcfa } from "@/constants/trip";
import { usePortefeuille, PORTEFEUILLE_QUERY_KEY } from "@/hooks/usePortefeuille";
import { BILLETS_QUERY_KEY } from "@/hooks/useBillets";
import { billetService } from "@/services/billet.service";
import { CategorieTarif, PaymentMode } from "@/types/billet";
import { formatApiError } from "@/utils/apiError";

type UiPaymentMethodId = "wave" | "orange" | "yas" | "wallet";

type PaymentMethod = {
  id: UiPaymentMethodId;
  label: string;
  logo?: number;
};

const methods: PaymentMethod[] = [
  { id: "wave", label: "Wave", logo: require("../../../assets/payment-logos/wave.png") },
  {
    id: "orange",
    label: "Orange Money",
    logo: require("../../../assets/payment-logos/orange-money.png"),
  },
  { id: "yas", label: "Yas", logo: require("../../../assets/payment-logos/yas.png") },
  { id: "wallet", label: "Portefeuille GO GOREE" },
];

// Wave/Orange Money/Yas passent tous par la même intégration Paydunya côté backend.
const PAYDUNYA_MODE_MAP: Record<"wave" | "orange" | "yas", PaymentMode> = {
  wave: "WAVE",
  orange: "ORANGE_MONEY",
  yas: "YAS",
};

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    voyageId: string;
    categorie: string;
    passengerLabel: string;
    total: string;
    date: string;
    free: string;
  }>();
  const passengerLabel = params.passengerLabel ?? "Adulte";
  const total = Number(params.total ?? 0);
  const date = params.date ?? "";
  const passengers = `1 ${passengerLabel}`;
  // Billet offert par l'abonnement résident : aucun mode de paiement à choisir.
  const isFree = params.free === "1";

  const [selected, setSelected] = useState<PaymentMethod["id"]>("wave");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: portefeuille } = usePortefeuille();
  const queryClient = useQueryClient();
  const balance = Number(portefeuille?.solde ?? 0);

  async function handlePay() {
    setError(null);

    if (!isFree && selected === "wallet" && total > balance) {
      setError("Solde insuffisant. Rechargez votre wallet ou choisissez un autre mode de paiement.");
      return;
    }

    setLoading(true);
    try {
      // En mode gratuit, le mode de paiement est ignoré côté backend (le billet
      // résident abonné est généré à 0 FCFA) : on envoie PORTEFEUILLE par défaut.
      const paymentMode: PaymentMode = isFree
        ? "PORTEFEUILLE"
        : selected === "wallet"
          ? "PORTEFEUILLE"
          : PAYDUNYA_MODE_MAP[selected];

      const { billet, redirectUrl } = await billetService.purchase({
        voyageId: params.voyageId,
        paymentMode,
        categorie: isFree ? undefined : (params.categorie as CategorieTarif),
      });

      // Seed du cache : l'écran de confirmation (et le détail) lisent
      // ["billet", id] sans refaire d'appel réseau au premier rendu.
      queryClient.setQueryData(["billet", billet.id], billet);
      queryClient.invalidateQueries({ queryKey: BILLETS_QUERY_KEY });

      if (paymentMode === "PORTEFEUILLE") {
        // Le solde vient d'être débité côté backend : on invalide le cache
        // pour que l'écran wallet et un futur retour ici affichent le vrai solde.
        queryClient.invalidateQueries({ queryKey: PORTEFEUILLE_QUERY_KEY });
      } else if (redirectUrl) {
        // Le navigateur système s'ouvre pour le checkout Paydunya. On ne
        // dépend jamais de sa fermeture "propre" pour savoir si le paiement a
        // réussi (peu fiable, surtout sous Expo Go) : l'écran de confirmation
        // vérifie le vrai statut via polling, indépendamment de comment on y
        // atterrit.
        await WebBrowser.openBrowserAsync(redirectUrl);
      }

      router.replace({
        pathname: "/ticket/confirmation",
        params: { ticketId: billet.id },
      });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
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
          Paiement
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View
          style={{
            backgroundColor: colors.inputBg,
            borderRadius: 16,
            padding: 16,
            marginBottom: 28,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark }}>
              {ROUTE.departure} ↔ {ROUTE.destination}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: isFree ? "#16A34A" : colors.primary }}>
              {isFree ? "Gratuit" : formatFcfa(total)}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textGray }}>
            {date} • {passengers} • Aller-Retour
          </Text>
        </View>

        {isFree ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#DCFCE7",
              borderRadius: 14,
              padding: 16,
              marginBottom: 32,
            }}
          >
            <Ionicons name="ribbon" size={22} color="#16A34A" style={{ marginRight: 12 }} />
            <Text style={{ flex: 1, fontSize: 13, color: "#166534", fontWeight: "600" }}>
              Ce billet est offert par votre abonnement résident. Aucun paiement requis.
            </Text>
          </View>
        ) : (
          <>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textDark, marginBottom: 14 }}>
          Choisir un mode de paiement
        </Text>

        <View style={{ marginBottom: 32 }}>
          {methods.map((method) => {
            const isSelected = selected === method.id;
            return (
              <Pressable
                key={method.id}
                onPress={() => setSelected(method.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primaryTint : colors.white,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: method.id === "wallet" ? colors.primary : colors.white,
                    borderWidth: method.id === "wallet" ? 0 : 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                    overflow: "hidden",
                  }}
                >
                  {method.id === "wallet" ? (
                    <Ionicons name="wallet" size={18} color={colors.white} />
                  ) : (
                    <Image
                      source={method.logo}
                      style={{ width: 32, height: 32 }}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textDark }}>
                    {method.label}
                  </Text>
                  {method.id === "wallet" ? (
                    <Text style={{ fontSize: 12, color: colors.textGray }}>
                      Solde: {formatFcfa(balance)}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 11, color: colors.textGray }}>via Paydunya</Text>
                  )}
                </View>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSelected && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colors.primary,
                      }}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
          </>
        )}

        {error ? (
          <Text style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{error}</Text>
        ) : null}

        <Pressable onPress={handlePay} disabled={loading}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 54,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>
              {loading
                ? isFree
                  ? "Réservation…"
                  : "Paiement en cours…"
                : isFree
                  ? "Confirmer ma réservation"
                  : `Payer ${formatFcfa(total)}`}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
