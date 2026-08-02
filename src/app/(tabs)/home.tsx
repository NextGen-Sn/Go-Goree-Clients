import { useMemo } from "react";
import { View, Text, Pressable, ScrollView, ImageBackground, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, gradients } from "@/constants/theme";
import { useVoyages, UPCOMING_VOYAGES_PARAMS } from "@/hooks/useVoyages";
import { formatHeureDepart, heureDepartBrute, todayIso } from "@/utils/date";
import { useAuth } from "@/hooks/useAuth";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: voyages, isLoading, isError } = useVoyages(UPCOMING_VOYAGES_PARAMS);
  const firstName = user?.name?.split(" ")[0];

  const sortedVoyages = useMemo(() => {
    if (!voyages) return [];
    return [...voyages].sort((a, b) => {
      const dateCompare = a.date_voyage.localeCompare(b.date_voyage);
      if (dateCompare !== 0) return dateCompare;
      return heureDepartBrute(a).localeCompare(heureDepartBrute(b));
    });
  }, [voyages]);

  const nextVoyage = sortedVoyages[0] ?? null;

  const todayDepartures = useMemo(() => {
    const today = todayIso();
    return sortedVoyages
      .filter((v) => v.date_voyage === today)
      .map((v) => formatHeureDepart(v.trajet?.heure_depart));
  }, [sortedVoyages]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ImageBackground
        source={require("../../../assets/goree.jpeg")}
        style={{ height: 350, width: "100%" }}
        imageStyle={{ width: "100%", height: "100%", resizeMode: "cover" }}
      >
        <SafeAreaView edges={["top"]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              paddingHorizontal: 20,
              paddingTop: 12,
            }}
          >
            <View>
              <Text style={{ color: colors.white, fontSize: 14 }}>{t("dashboard.hello")}</Text>
              <Text style={{ color: colors.white, fontSize: 24, fontWeight: "800" }}>
                {firstName ?? t("dashboard.defaultUser")}
              </Text>
            </View>
            <Pressable
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.white} />
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textDark }}>
            {t("dashboard.nextDeparture")}
          </Text>
          <Pressable>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
              {t("dashboard.viewAll")}
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 18,
            padding: 18,
            marginBottom: 28,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          {isLoading ? (
            <View style={{ paddingVertical: 12, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : isError ? (
            <Text style={{ fontSize: 13, color: colors.textGray, paddingVertical: 8 }}>
              {t("dashboard.errorLoadingVoyages")}
            </Text>
          ) : !nextVoyage ? (
            <Text style={{ fontSize: 13, color: colors.textGray, paddingVertical: 8 }}>
              {t("dashboard.noVoyage")}
            </Text>
          ) : (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textDark }}>
                  {t("dashboard.routeDakarGoree")}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                  {formatHeureDepart(nextVoyage.trajet?.heure_depart)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="people-outline" size={16} color={colors.textGray} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, color: colors.textGray }}>
                  {t("dashboard.placesAvailable", { count: nextVoyage.places_restantes })}
                </Text>
              </View>
            </>
          )}

          <Pressable onPress={() => router.push("/ticket/new")}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 50,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.white }}>
                {t("dashboard.buyTicket")}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textDark, marginBottom: 12 }}>
          {t("dashboard.ferrySchedules")}
        </Text>

        <View
          style={{
            backgroundColor: colors.inputBg,
            borderRadius: 18,
            padding: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="boat" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textDark, marginRight: 8 }}>
                GO GOREE
              </Text>
              <Text style={{ fontSize: 13, color: colors.textGray }}>
                {t("dashboard.todayDepartures")}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#DCFCE7",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 10,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#22C55E",
                  marginRight: 4,
                }}
              />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#16A34A" }}>{t("dashboard.live")}</Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textDark, marginRight: 6 }}>
                Dakar → Gorée
              </Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textGray} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>
              {t("dashboard.ferryDuration")}
            </Text>
          </View>

          <Text style={{ fontSize: 13, color: colors.textGray, lineHeight: 20 }}>
            {todayDepartures.length > 0
              ? todayDepartures.join(", ")
              : t("dashboard.noDeparturesToday")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
