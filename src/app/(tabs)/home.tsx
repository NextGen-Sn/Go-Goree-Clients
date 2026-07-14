import { View, Text, Pressable, ScrollView, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { colors, gradients } from "@/constants/theme";

const departures = ["07h00", "08h30", "10h00", "12h00", "14h30", "16h00", "17h30"];

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ImageBackground
        source={require("../../../assets/goree.jpeg")}
        style={{ height: 260, width: "100%" }}
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
              <Text style={{ color: colors.white, fontSize: 14 }}>Bonjour,</Text>
              <Text style={{ color: colors.white, fontSize: 24, fontWeight: "800" }}>
                Boubacar
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
            Prochain départ
          </Text>
          <Pressable>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
              Voir tout
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textDark }}>
              Dakar → Île de Gorée
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
              10h30
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="people-outline" size={16} color={colors.textGray} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, color: colors.textGray }}>
              45 places disponibles
            </Text>
          </View>

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
                Acheter un billet
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textDark, marginBottom: 12 }}>
          Horaires des chaloupes
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
                Départs aujourd'hui
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
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#16A34A" }}>Live</Text>
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
              20 min
            </Text>
          </View>

          <Text style={{ fontSize: 13, color: colors.textGray, lineHeight: 20 }}>
            {departures.join(", ")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
