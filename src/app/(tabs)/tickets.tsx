import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, gradients } from "@/constants/theme";
import { useBillets } from "@/hooks/useBillets";
import { formatFcfa } from "@/constants/trip";
import { Ticket, TicketStatus } from "@/types";

const VISIBLE_COUNT = 5;

const STATUS_STYLES: Record<TicketStatus, { bg: string; text: string }> = {
  en_attente: { bg: "#FEF3C7", text: "#D97706" },
  valide: { bg: "#DCFCE7", text: "#16A34A" },
  "utilisé": { bg: colors.inputBg, text: colors.textGray },
  "expiré": { bg: "#FEE2E2", text: "#DC2626" },
};

const STATUS_TRANSLATION_KEYS: Record<TicketStatus, string> = {
  en_attente: "tickets.statusPending",
  valide: "tickets.statusValid",
  "utilisé": "tickets.statusUsed",
  "expiré": "tickets.statusExpired",
};

type FilterId = "tous" | TicketStatus;

const FILTERS: { id: FilterId; translationKey: string }[] = [
  { id: "tous", translationKey: "tickets.filterAll" },
  { id: "en_attente", translationKey: "tickets.filterPending" },
  { id: "valide", translationKey: "tickets.filterActive" },
  { id: "utilisé", translationKey: "tickets.filterUsed" },
  { id: "expiré", translationKey: "tickets.filterExpired" },
];

function TicketCard({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation();
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
            {t(STATUS_TRANSLATION_KEYS[ticket.status])}
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
            {t("tickets.viewQrCode")}
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
  const { t } = useTranslation();
  const { data: tickets = [], isLoading, isError, refetch, isRefetching } = useBillets();
  const [filter, setFilter] = useState<FilterId>("tous");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(
    () => (filter === "tous" ? tickets : tickets.filter((t) => t.status === filter)),
    [tickets, filter]
  );
  const visibleTickets = showAll ? filtered : filtered.slice(0, VISIBLE_COUNT);
  const hasMore = filtered.length > VISIBLE_COUNT && !showAll;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textDark }}>
          {t("tickets.title")}
        </Text>
        <Pressable onPress={() => router.push("/ticket/new")}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={22} color={colors.white} />
          </LinearGradient>
        </Pressable>
      </View>

      {tickets.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
        >
          {FILTERS.map((f, i) => {
            const isActive = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  setFilter(f.id);
                  setShowAll(false);
                }}
                style={{
                  paddingHorizontal: 16,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isActive ? colors.primary : colors.inputBg,
                  marginRight: i === FILTERS.length - 1 ? 0 : 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: isActive ? colors.white : colors.textGray,
                  }}
                >
                  {t(f.translationKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 15, color: colors.textGray, textAlign: "center", marginBottom: 16 }}>
            {t("tickets.errorLoading")}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={{
              paddingHorizontal: 24,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primaryTint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : tickets.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.primaryTint,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="ticket-outline" size={44} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textDark, marginBottom: 8 }}>
            {t("tickets.noTicketsTitle")}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginBottom: 28 }}>
            {t("tickets.noTicketsSubtitle")}
          </Text>
          <Pressable onPress={() => router.push("/ticket/new")} style={{ width: "100%" }}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>
                {t("tickets.buyBillet")}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleTickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => <TicketCard ticket={item} />}
          ListEmptyComponent={
            <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginTop: 20 }}>
              {t("tickets.noTicketsInCategory")}
            </Text>
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable onPress={() => setShowAll(true)}>
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    borderRadius: 14,
                    height: 48,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>
                    {t("tickets.viewAllCount", { count: filtered.length })}
                  </Text>
                </View>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
