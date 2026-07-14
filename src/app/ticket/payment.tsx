import { useState } from "react";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { colors, gradients } from "@/constants/theme";
import { ROUTE, formatFcfa } from "@/constants/trip";
import { useWallet } from "@/hooks/useWallet";
import { payViaPaydunya, PaydunyaMethod } from "@/services/paydunya.service";

type PaymentMethod = {
  id: PaydunyaMethod | "wallet";
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

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    passengerLabel: string;
    total: string;
    date: string;
  }>();
  const passengerLabel = params.passengerLabel ?? "Adulte résident";
  const total = Number(params.total ?? 0);
  const date = params.date ?? "";
  const passengers = `1 ${passengerLabel}`;

  const [selected, setSelected] = useState<PaymentMethod["id"]>("wave");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();

  async function handlePay() {
    setError(null);

    if (selected === "wallet" && total > wallet.balance) {
      setError("Solde insuffisant. Rechargez votre wallet ou choisissez un autre mode de paiement.");
      return;
    }

    setLoading(true);
    try {
      if (selected === "wallet") {
        wallet.pay(total, `Billet ${ROUTE.departure} ↔ ${ROUTE.destination}`);
      } else {
        const result = await payViaPaydunya(selected, total);
        if (!result.success) {
          setError("Le paiement a échoué. Veuillez réessayer.");
          setLoading(false);
          return;
        }
      }
      router.replace({
        pathname: "/ticket/confirmation",
        params: { total: String(total), date, passengers },
      });
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
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary }}>
              {formatFcfa(total)}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textGray }}>
            {date} • {passengers} • Aller-Retour
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
                      Solde: {formatFcfa(wallet.balance)}
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
