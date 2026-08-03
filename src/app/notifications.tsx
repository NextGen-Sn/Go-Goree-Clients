import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { colors } from "@/constants/theme";
import { useMarquerNotificationLue, useNotifications } from "@/hooks/useNotifications";
import { Notification } from "@/services/notification.service";

/** Apparence dérivée du type renvoyé par l'API. */
const APPARENCE: Record<
  Notification["type"],
  { icon: keyof typeof Ionicons.glyphMap; couleur: string; fond: string }
> = {
  PAYEMENT: { icon: "checkmark-circle", couleur: "#16A34A", fond: "#DCFCE7" },
  ALERTE: { icon: "boat", couleur: colors.primary, fond: colors.primaryTint },
};

/** « à l'instant », « il y a 2 h », « il y a 3 j », puis la date. */
function depuis(iso: string, locale: string, t: TFunction): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return t("notifications.justNow");
  if (minutes < 60) return t("notifications.minutesAgo", { count: minutes });

  const heures = Math.round(minutes / 60);
  if (heures < 24) return t("notifications.hoursAgo", { count: heures });

  const jours = Math.round(heures / 24);
  if (jours <= 7) return t("notifications.daysAgo", { count: jours });

  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long" });
}

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const { data: notifications = [], isPending, isError, refetch, isRefetching } = useNotifications();
  const marquerLue = useMarquerNotificationLue();

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
          {t("notifications.title")}
        </Text>
      </View>

      {isPending ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="cloud-offline-outline" size={44} color={colors.textGray} />
          <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginTop: 12 }}>
            {t("notifications.errorLoading")}
          </Text>
          <Pressable onPress={() => refetch()} style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>
              {t("common.retry")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          renderItem={({ item }) => {
            const apparence = APPARENCE[item.type] ?? APPARENCE.ALERTE;
            return (
              <Pressable
                onPress={() => !item.lue && marquerLue.mutate(item.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  backgroundColor: item.lue ? colors.white : colors.primaryTint,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: item.lue ? colors.border : colors.primaryLight,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: apparence.fond,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={apparence.icon} size={18} color={apparence.couleur} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: colors.textDark }}>
                      {item.titre}
                    </Text>
                    {!item.lue && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: colors.primary,
                          marginLeft: 8,
                        }}
                      />
                    )}
                  </View>
                  {item.message ? (
                    <Text
                      style={{ fontSize: 13, color: colors.textGray, marginBottom: 6, lineHeight: 18 }}
                    >
                      {item.message}
                    </Text>
                  ) : null}
                  <Text style={{ fontSize: 11, color: colors.textGray }}>
                    {depuis(item.createdAt, i18n.language, t)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="notifications-off-outline" size={44} color={colors.textGray} />
              <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginTop: 12 }}>
                {t("notifications.empty")}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
