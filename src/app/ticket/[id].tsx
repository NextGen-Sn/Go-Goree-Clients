import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { colors } from "@/constants/theme";
import { useTickets } from "@/hooks/useTickets";
import { formatFcfa } from "@/constants/trip";
import { Ticket } from "@/types";

const STATUS_STYLES: Record<Ticket["status"], { bg: string; text: string }> = {
  valide: { bg: "#DCFCE7", text: "#16A34A" },
  "utilisé": { bg: colors.inputBg, text: colors.textGray },
  "expiré": { bg: "#FEE2E2", text: "#DC2626" },
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTicket } = useTickets();
  const ticket = getTicket(id);

  if (!ticket) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 15, color: colors.textGray, textAlign: "center" }}>
            Billet introuvable.
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = STATUS_STYLES[ticket.status];

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
          Détail du billet
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, alignItems: "center" }}>
        <View
          style={{
            width: "100%",
            backgroundColor: colors.inputBg,
            borderRadius: 24,
            padding: 24,
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: statusStyle.bg,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: statusStyle.text }}>
              {ticket.status}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Ionicons name="qr-code" size={160} color={colors.textDark} />
          </View>

          <Text style={{ fontSize: 12, color: colors.textGray, marginBottom: 4 }}>
            N° {ticket.id}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textDark, marginBottom: 4 }}>
            {ticket.departure} ↔ {ticket.destination}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textGray }}>{ticket.dateLabel}</Text>
        </View>

        <View style={{ width: "100%", marginTop: 20 }}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Passagers</Text>
            <Text style={styles.rowValue}>{ticket.passengersLabel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Montant payé</Text>
            <Text style={styles.rowValue}>{formatFcfa(ticket.total)}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Acheté le</Text>
            <Text style={styles.rowValue}>
              {new Date(ticket.purchasedAt).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  row: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 14,
    color: colors.textGray,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: colors.textDark,
  },
};
