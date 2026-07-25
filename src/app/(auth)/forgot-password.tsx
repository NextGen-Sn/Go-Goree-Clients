import { useState } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, gradients } from "@/constants/theme";
import { TextField } from "@/components/ui/TextField";
import { PillButton } from "@/components/ui/PillButton";
import { useRetryCountdown } from "@/hooks/useRetryCountdown";
import { authService } from "@/services/auth.service";
import { formatApiError, getRetryAfterSeconds } from "@/utils/apiError";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { secondsLeft, start: startCountdown } = useRetryCountdown();

  async function handleSubmit() {
    setError(null);
    if (!email.trim()) {
      setError(t("auth.emailRequired"));
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      router.push({ pathname: "/(auth)/reset-password", params: { email: email.trim() } });
    } catch (err) {
      setError(formatApiError(err));
      const retry = getRetryAfterSeconds(err);
      if (retry) startCountdown(retry);
    } finally {
      setLoading(false);
    }
  }

  const isBlocked = secondsLeft > 0;

  return (
    <LinearGradient colors={gradients.primary} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28 }} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginTop: 12 }}>
              <Ionicons name="chevron-back" size={26} color={colors.white} />
            </Pressable>

            <View style={{ marginTop: 24, marginBottom: 24 }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: colors.white, marginBottom: 8 }}>
                {t("auth.forgotPasswordTitle")}
              </Text>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 20 }}>
                {t("auth.forgotPasswordSubtitle")}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 24,
                padding: 24,
              }}
            >
              <TextField
                icon="mail-outline"
                variant="onBlue"
                placeholder={t("auth.email")}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              {error ? (
                <Text style={{ color: "#FCA5A5", marginTop: 12 }}>{error}</Text>
              ) : null}

              <View style={{ marginTop: 20 }}>
                <PillButton
                  label={isBlocked ? t("auth.retryIn", { seconds: secondsLeft }) : t("auth.sendCode")}
                  variant="white"
                  loading={loading}
                  disabled={isBlocked}
                  onPress={handleSubmit}
                />
              </View>

              <Pressable
                onPress={() => router.push("/(auth)/reset-password")}
                style={{ alignSelf: "center", marginTop: 16 }}
              >
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                  {t("auth.alreadyHaveCode")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
