import { useState } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { colors } from "@/constants/theme";
import { TextField } from "@/components/ui/TextField";
import { PillButton } from "@/components/ui/PillButton";

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("+221 ");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // TODO: brancher authService.register une fois l'API disponible
      router.replace("/(auth)/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
            <Ionicons name="chevron-back" size={26} color={colors.textDark} />
          </Pressable>

          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.textDark, marginBottom: 24 }}>
            Créer un compte
          </Text>

          <View style={{ gap: 18 }}>
            <View>
              <Text style={styles.label}>Nom</Text>
              <TextField
                icon="person-outline"
                placeholder="Sow"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View>
              <Text style={styles.label}>Prénom</Text>
              <TextField
                icon="person-outline"
                placeholder="Boubacar"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View>
              <Text style={styles.label}>Téléphone</Text>
              <TextField
                icon="call-outline"
                placeholder="+221"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View>
              <Text style={styles.label}>Email</Text>
              <TextField
                icon="mail-outline"
                placeholder="boubacar@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text style={styles.label}>Mot de passe</Text>
              <TextField
                icon="lock-closed-outline"
                placeholder="········"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View>
              <Text style={styles.label}>Confirmer mot de passe</Text>
              <TextField
                icon="lock-closed-outline"
                placeholder="········"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {error ? (
            <Text style={{ color: "#DC2626", marginTop: 16 }}>{error}</Text>
          ) : null}

          <View style={{ marginTop: 28 }}>
            <PillButton
              label="Créer mon compte"
              variant="gradient"
              loading={loading}
              onPress={handleSubmit}
            />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20 }}>
            <Text style={{ color: colors.textGray }}>Déjà un compte ? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text style={{ color: colors.primary, fontWeight: "700" }}>Se connecter</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textDark,
    marginBottom: 6,
  },
};
