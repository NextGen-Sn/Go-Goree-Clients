import { useState } from "react";
import { View, Text, Pressable, Image, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { colors, gradients } from "@/constants/theme";
import { TextField } from "@/components/ui/TextField";
import { PillButton } from "@/components/ui/PillButton";
import { SocialButton } from "@/components/ui/SocialButton";
import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    try {
      setError(null);
      setLoading(true);
      await login({ email, password });
      router.replace("/(tabs)");
    } catch (err) {
      setError((err as { message: string }).message ?? "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={gradients.primary} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ alignItems: "center", marginTop: 24, marginBottom: 12 }}>
              <Image
                source={require("../../../assets/logo.png")}
                style={{ width: 150, height: 150 }}
                resizeMode="contain"
              />
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 24,
                padding: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.white,
                  marginBottom: 20,
                }}
              >
                Connexion
              </Text>

              <View style={{ gap: 14 }}>
                <TextField
                  icon="mail-outline"
                  variant="onBlue"
                  placeholder="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <TextField
                  icon="lock-closed-outline"
                  variant="onBlue"
                  placeholder="Mot de passe"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Pressable style={{ alignSelf: "flex-end", marginTop: 12, marginBottom: 24 }}>
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                  Mot de passe oublié ?
                </Text>
              </Pressable>

              {error ? (
                <Text style={{ color: "#FCA5A5", marginBottom: 12 }}>{error}</Text>
              ) : null}

              <PillButton
                label="Connexion"
                variant="white"
                loading={loading}
                onPress={handleSubmit}
              />

              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.25)" }} />
                <Text style={{ marginHorizontal: 12, color: "rgba(255,255,255,0.7)" }}>ou</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.25)" }} />
              </View>

              <View style={{ gap: 12 }}>
                <SocialButton label="Continuer avec Google" icon="logo-google" />
                <SocialButton label="Continuer avec Apple" icon="logo-apple" />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginVertical: 24,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                Pas encore de compte ?{" "}
              </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text style={{ color: colors.white, fontWeight: "700" }}>
                    Créer un compte
                  </Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
