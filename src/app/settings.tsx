import { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors } from "@/constants/theme";
import { APP_NAME } from "@/constants/config";

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: "700",
        color: colors.textGray,
        marginBottom: 10,
        marginTop: 20,
      }}
    >
      {children}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  last,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ flex: 1, fontSize: 15, color: colors.textDark }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function LinkRow({ label, value, last }: { label: string; value?: string; last?: boolean }) {
  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ flex: 1, fontSize: 15, color: colors.textDark }}>{label}</Text>
      {value ? (
        <Text style={{ fontSize: 14, color: colors.textGray, marginRight: 6 }}>{value}</Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textGray} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.inputBg }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
          backgroundColor: colors.inputBg,
        }}
      >
        <Pressable onPress={() => router.canGoBack() && router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.textDark} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textDark, marginLeft: 12 }}>
          Paramètres
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <SectionLabel>SÉCURITÉ</SectionLabel>
        <Card>
          <ToggleRow label="Notifications push" value={pushEnabled} onValueChange={setPushEnabled} />
          <ToggleRow
            label="Biométrie / Face ID"
            value={biometricsEnabled}
            onValueChange={setBiometricsEnabled}
            last
          />
        </Card>

        <SectionLabel>PRÉFÉRENCES</SectionLabel>
        <Card>
          <LinkRow label="Langue de l'app" value="Français" />
          <LinkRow label="Thème" value="Clair" last />
        </Card>

        <View style={{ alignItems: "center", marginTop: 32 }}>
          <Text style={{ fontSize: 12, color: colors.textGray }}>
            © {APP_NAME.toUpperCase()} v1.0.0
          </Text>
          <Pressable style={{ marginTop: 6 }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.textGray,
                textDecorationLine: "underline",
              }}
            >
              Conditions Générales d'Utilisation
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
