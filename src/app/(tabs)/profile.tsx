import { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { colors, gradients } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ProfileRow({
  icon,
  label,
  value,
  onPress,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colors.primaryTint,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.textDark }}>
        {label}
      </Text>
      {right ? (
        right
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {value ? (
            <Text style={{ fontSize: 14, color: colors.textGray, marginRight: 6 }}>{value}</Text>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={colors.textGray} />
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.white }}>
              {user ? initials(user.name) : "?"}
            </Text>
          </LinearGradient>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textDark }}>
            {user?.name ?? "Utilisateur"}
          </Text>
          {user?.phone ? (
            <Text style={{ fontSize: 13, color: colors.textGray, marginTop: 4 }}>
              {user.phone}
            </Text>
          ) : null}
          <Text style={{ fontSize: 13, color: colors.textGray, marginTop: 2 }}>
            {user?.email ?? ""}
          </Text>
        </View>

        <ProfileRow
          icon="person-outline"
          label="Demande carte résident"
          onPress={() => router.push("/demande-carte-resident")}
        />
        <ProfileRow icon="create-outline" label="Modifier le profil" />
        <ProfileRow icon="lock-closed-outline" label="Changer mot de passe" />
        <ProfileRow
          icon="globe-outline"
          label="Langue"
          value="Français"
          onPress={() => router.push("/settings")}
        />
        <ProfileRow
          icon="moon-outline"
          label="Mode sombre"
          right={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          }
        />
        <ProfileRow icon="help-circle-outline" label="Centre d'aide" />

        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: colors.textGray,
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          COMPTE
        </Text>
        <ProfileRow
          icon="notifications-outline"
          label="Notifications"
          onPress={() => router.push("/notifications")}
        />
        <ProfileRow
          icon="settings-outline"
          label="Paramètres"
          onPress={() => router.push("/settings")}
        />
        <ProfileRow
          icon="ticket-outline"
          label="Mes billets"
          onPress={() => router.push("/(tabs)/tickets")}
        />

        <Pressable
          onPress={handleLogout}
          style={{
            marginTop: 8,
            height: 52,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: "#FECACA",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#DC2626" }}>
            Se déconnecter
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
