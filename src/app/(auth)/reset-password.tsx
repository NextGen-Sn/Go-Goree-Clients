import { useState } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { colors, gradients } from "@/constants/theme";
import { TextField } from "@/components/ui/TextField";
import { PillButton } from "@/components/ui/PillButton";
import { authService } from "@/services/auth.service";
import { formatApiError } from "@/utils/apiError";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email.trim()) return setError(t("auth.emailRequiredShort"));
    if (code.trim().length !== 6) return setError(t("auth.codeRequiredLength"));
    if (password.length < 8) return setError(t("auth.passwordMinLengthShort"));
    if (password !== confirm) return setError(t("auth.passwordsMustMatch"));

    setLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        code: code.trim(),
        password,
        passwordConfirmation: confirm,
      });
      Alert.alert(t("auth.resetSuccessTitle"), t("auth.resetSuccessMessage"), [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

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
                {t("auth.newPassword")}
              </Text>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 20 }}>
                {t("auth.resetPasswordSubtitle")}
              </Text>
            </View>

            <View style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 24, padding: 24 }}>
              {!params.email ? (
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
              ) : null}

              <View style={{ marginBottom: 14 }}>
                <TextField
                  icon="keypad-outline"
                  variant="onBlue"
                  placeholder={t("auth.codePlaceholder")}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
              </View>
              <View style={{ marginBottom: 14 }}>
                <TextField
                  icon="lock-closed-outline"
                  variant="onBlue"
                  placeholder={t("auth.newPassword")}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <TextField
                icon="lock-closed-outline"
                variant="onBlue"
                placeholder={t("auth.confirmPassword")}
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />

              {error ? <Text style={{ color: "#FCA5A5", marginTop: 12 }}>{error}</Text> : null}

              <View style={{ marginTop: 20 }}>
                <PillButton
                  label={t("auth.resetButton")}
                  variant="white"
                  loading={loading}
                  onPress={handleSubmit}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
