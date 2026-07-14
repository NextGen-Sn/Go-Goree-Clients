import { View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { colors, gradients } from "@/constants/theme";
import { useTickets } from "@/hooks/useTickets";
import { formatFcfa } from "@/constants/trip";
import { Ticket } from "@/types";

const STATUS_STYLES: Record<Ticket["status"], { bg: string; text: string }> = {
  valide: { bg: "#DCFCE7", text: "#16A34A" },
  "utilisé": { bg: colors.inputBg, text: colors.textGray },
  "expiré": { bg: "#FEE2E2", text: "#DC2626" },
};

function TicketCard({ ticket }: { ticket: Ticket }) {
  const statusStyle = STATUS_STYLES[ticket.status];

  return (
    <Pressable
      onPress={() => router.push(`/ticket/${ticket.id}`)}
      style={{
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textDark }}>
            {ticket.departure} ↔ {ticket.destination}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textGray, marginTop: 2 }}>
            {ticket.dateLabel} • {ticket.passengersLabel}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: statusStyle.bg,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: statusStyle.text }}>
            {ticket.status}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="qr-code-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>
            Voir le QR code
          </Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: "800", color: colors.textDark }}>
          {formatFcfa(ticket.total)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function TicketsScreen() {
  const { tickets } = useTickets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textDark }}>
          Mes billets
        </Text>
      </View>

      {tickets.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: "#EFF4FF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="ticket-outline" size={44} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textDark, marginBottom: 8 }}>
            Aucun billet pour l'instant
          </Text>
          <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginBottom: 28 }}>
            Réservez votre traversée Dakar ↔ Île de Gorée et retrouvez vos billets ici.
          </Text>
          <Pressable onPress={() => router.push("/ticket/new")} style={{ width: "100%" }}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>
                Acheter un billet
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          ListFooterComponent={
            <Pressable onPress={() => router.push("/ticket/new")} style={{ marginTop: 4 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  borderRadius: 14,
                  height: 54,
                }}
              >
                <Ionicons name="add" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
                  Acheter un nouveau billet
                </Text>
              </View>
            </Pressable>
          }
        />
      )}
    </SafeAreaView>
  );
}
