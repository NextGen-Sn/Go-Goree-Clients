import { useEffect, useRef } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors } from "@/constants/theme";
import { PillButton } from "@/components/ui/PillButton";
import { ROUTE, formatFcfa } from "@/constants/trip";
import { useTickets } from "@/hooks/useTickets";

export default function ConfirmationScreen() {
  const params = useLocalSearchParams<{ total: string; date: string; passengers: string }>();
  const total = Number(params.total ?? 0);
  const { addTicket } = useTickets();
  const hasAdded = useRef(false);

  useEffect(() => {
    if (hasAdded.current) return;
    hasAdded.current = true;
    addTicket({
      departure: ROUTE.departure,
      destination: ROUTE.destination,
      dateLabel: params.date ?? "",
      passengersLabel: params.passengers ?? "",
      total,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 28, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: "#DCFCE7",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Ionicons name="checkmark" size={48} color="#16A34A" />
        </View>

        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textDark, marginBottom: 8 }}>
          Paiement réussi !
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textGray,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Votre billet a été généré. Retrouvez-le dans l'onglet Billets avec son QR Code.
        </Text>

        <View
          style={{
            width: "100%",
            backgroundColor: colors.inputBg,
            borderRadius: 18,
            padding: 20,
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <Ionicons name="qr-code" size={120} color={colors.textDark} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark, marginTop: 16 }}>
            {ROUTE.departure} ↔ {ROUTE.destination}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textGray, marginTop: 4 }}>
            {params.date} • {params.passengers}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary, marginTop: 8 }}>
            {formatFcfa(total)}
          </Text>
        </View>

        <View style={{ width: "100%", marginBottom: 12 }}>
          <PillButton
            label="Voir mes billets"
            variant="gradient"
            onPress={() => router.replace("/(tabs)/tickets")}
          />
        </View>
        <PillButton
          label="Retour à l'accueil"
          variant="outline"
          onPress={() => router.replace("/(tabs)/home")}
        />
      </View>
    </SafeAreaView>
  );
}
