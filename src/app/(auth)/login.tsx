import { useState } from "react";
import { View, Text, Pressable, Image, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, gradients } from "@/constants/theme";
import { TextField } from "@/components/ui/TextField";
import { PillButton } from "@/components/ui/PillButton";
import { SocialButton } from "@/components/ui/SocialButton";
import { useAuth } from "@/hooks/useAuth";
import { useRetryCountdown } from "@/hooks/useRetryCountdown";
import { formatApiError, getRetryAfterSeconds } from "@/utils/apiError";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { secondsLeft, start: startRetryCountdown } = useRetryCountdown();

  async function handleSubmit() {
    try {
      setError(null);
      setLoading(true);
      await login({ email, password });
      router.replace("/(tabs)/home");
    } catch (err) {
      setError(formatApiError(err));
      const retryAfter = getRetryAfterSeconds(err);
      if (retryAfter) startRetryCountdown(retryAfter);
    } finally {
      setLoading(false);
    }
  }

  const isBlocked = secondsLeft > 0;

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
                {t("auth.login")}
              </Text>

              <View>
                <View style={{ marginBottom: 14 }}>
                  <TextField
                    icon="mail-outline"
                    variant="onBlue"
                    placeholder={t("auth.email")}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                <TextField
                  icon="lock-closed-outline"
                  variant="onBlue"
                  placeholder={t("auth.password")}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Pressable
                onPress={() => router.push("/(auth)/forgot-password")}
                style={{ alignSelf: "flex-end", marginTop: 12, marginBottom: 24 }}
              >
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                  {t("auth.forgotPassword")}
                </Text>
              </Pressable>

              {error ? (
                <Text style={{ color: "#FCA5A5", marginBottom: 12 }}>{error}</Text>
              ) : null}

              <PillButton
                label={isBlocked ? t("auth.retryIn", { seconds: secondsLeft }) : t("auth.login")}
                variant="white"
                loading={loading}
                disabled={isBlocked}
                onPress={handleSubmit}
              />

              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 20 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.25)" }} />
                <Text style={{ marginHorizontal: 12, color: "rgba(255,255,255,0.7)" }}>{t("auth.or")}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.25)" }} />
              </View>

              <View>
                <View style={{ marginBottom: 12 }}>
                  <SocialButton label={t("auth.continueWithGoogle")} icon="logo-google" />
                </View>
                <SocialButton label={t("auth.continueWithApple")} icon="logo-apple" />
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
                {t("auth.noAccount").split("?")[0]}?{" "}
              </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text style={{ color: colors.white, fontWeight: "700" }}>
                    {t("auth.createAccount")}
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
