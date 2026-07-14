import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { colors, gradients } from "@/constants/theme";
import { ROUTE, formatFcfa } from "@/constants/trip";
import { useWallet } from "@/hooks/useWallet";

type PaymentMethod = {
  id: string;
  label: string;
  badgeColor: string;
  badgeText: string;
};

const methods: PaymentMethod[] = [
  { id: "wave", label: "Wave", badgeColor: "#1D9BF0", badgeText: "W" },
  { id: "orange", label: "Orange Money", badgeColor: "#FF7900", badgeText: "OM" },
  { id: "yas", label: "Yas", badgeColor: "#FFC800", badgeText: "Y" },
  { id: "wallet", label: "Portefeuille GO GOREE", badgeColor: colors.primary, badgeText: "" },
];

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    adults: string;
    children: string;
    foreigners: string;
    total: string;
    date: string;
  }>();
  const adults = Number(params.adults ?? 1);
  const children = Number(params.children ?? 0);
  const foreigners = Number(params.foreigners ?? 0);
  const total = Number(params.total ?? 0);
  const date = params.date ?? "";

  const [selected, setSelected] = useState<string>("wave");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();

  function passengersLabel() {
    const parts = [`${adults} adulte${adults > 1 ? "s" : ""}`];
    if (children > 0) parts.push(`${children} enfant${children > 1 ? "s" : ""}`);
    if (foreigners > 0) parts.push(`${foreigners} étranger${foreigners > 1 ? "s" : ""}`);
    return parts.join(", ");
  }

  function handlePay() {
    setError(null);

    if (selected === "wallet" && total > wallet.balance) {
      setError("Solde insuffisant. Rechargez votre wallet ou choisissez un autre mode de paiement.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (selected === "wallet") {
        wallet.pay(total, `Billet ${ROUTE.departure} ↔ ${ROUTE.destination}`);
      }
      router.replace({
        pathname: "/ticket/confirmation",
        params: { total: String(total), date, passengers: passengersLabel() },
      });
    }, 900);
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
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>
              {formatFcfa(total)}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textGray }}>
            {date} • {passengersLabel()} • Aller-Retour
          </Text>
        </View>

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
                  backgroundColor: isSelected ? "#EFF4FF" : colors.white,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: method.badgeColor,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  {method.id === "wallet" ? (
                    <Ionicons name="wallet" size={18} color={colors.white} />
                  ) : (
                    <Text style={{ color: colors.white, fontWeight: "800", fontSize: 13 }}>
                      {method.badgeText}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textDark }}>
                    {method.label}
                  </Text>
                  {method.id === "wallet" ? (
                    <Text style={{ fontSize: 12, color: colors.textGray }}>
                      Solde: {formatFcfa(wallet.balance)}
                    </Text>
                  ) : null}
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
              {loading ? "Paiement en cours…" : `Payer ${formatFcfa(total)}`}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
