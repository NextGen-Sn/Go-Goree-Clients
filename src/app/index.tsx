import { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { useTranslation } from "react-i18next";
import { colors } from "@/constants/theme";
import { PillButton } from "@/components/ui/PillButton";
import { useAuth } from "@/hooks/useAuth";
import { storage } from "@/utils/storage";
import { ONBOARDING_SEEN_KEY } from "@/constants/config";

type LockState = "idle" | "unlocked" | "locked";

/**
 * Routeur de démarrage :
 *  - session valide -> déverrouillage biométrique (Face ID / empreinte) -> accueil ;
 *  - pas de session -> onboarding au tout premier lancement, sinon login.
 * La session Sanctum est persistée dans le SecureStore : on ne retape son mot de
 * passe que si elle a expiré ou après une déconnexion explicite.
 */
type Biometric = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  key: "default" | "facial" | "fingerprint";
};

// Par défaut "biométrie" tant qu'on n'a pas détecté le matériel réel de l'appareil.
const DEFAULT_BIOMETRIC: Biometric = { icon: "finger-print", label: "biométrie", key: "default" };

export default function Index() {
  const { t } = useTranslation();
  const { user, isLoading, logout } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [lockState, setLockState] = useState<LockState>("idle");
  const [unlocking, setUnlocking] = useState(false);
  const [biometric, setBiometric] = useState<Biometric>(DEFAULT_BIOMETRIC);
  const attemptedAutoUnlock = useRef(false);

  useEffect(() => {
    (async () => {
      const seen = await storage.get(ONBOARDING_SEEN_KEY);
      setOnboardingSeen(Boolean(seen));

      // Adapte l'icône et le libellé au capteur réel : Face ID (iPhone récents),
      // Touch ID / empreinte (Android, anciens iPhone), sinon "biométrie".
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometric({ icon: "scan-outline", label: "Face ID", key: "facial" });
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometric({ icon: "finger-print", label: "empreinte", key: "fingerprint" });
      }
    })();
  }, []);

  async function tryUnlock() {
    if (unlocking) return;
    setUnlocking(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync());
      if (!hasHardware || !isEnrolled) {
        // Pas de biométrie configurée sur l'appareil (ou web) : la session
        // suffit, on ne bloque pas l'utilisateur derrière un verrou impossible.
        setLockState("unlocked");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("lockScreen.unlockWith", { biometric: t(`biometrics.${biometric.key}`) }),
        cancelLabel: t("common.cancel"),
      });
      setLockState(result.success ? "unlocked" : "locked");
    } catch {
      setLockState("locked");
    } finally {
      setUnlocking(false);
    }
  }

  useEffect(() => {
    if (user && lockState === "idle" && !attemptedAutoUnlock.current) {
      attemptedAutoUnlock.current = true;
      tryUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, lockState]);

  async function switchAccount() {
    await logout();
    router.replace("/(auth)/login");
  }

  if (isLoading || onboardingSeen === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" }}>
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: 120, height: 120, marginBottom: 24 }}
          resizeMode="contain"
        />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href={onboardingSeen ? "/(auth)/login" : "/onboarding"} />;
  }

  if (lockState === "unlocked") {
    return <Redirect href="/(tabs)/home" />;
  }

  // Session valide mais biométrie pas (encore) validée : écran de verrouillage.
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: 110, height: 110, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textDark, marginBottom: 6 }}>
          {t("lockScreen.welcomeBack", { name: user.name ? `, ${user.name.split(" ")[0]}` : "" })}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textGray, textAlign: "center", marginBottom: 36 }}>
          {lockState === "locked"
            ? t("lockScreen.authCancelled")
            : t("lockScreen.confirmIdentity")}
        </Text>

        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.primaryTint,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <Ionicons name={biometric.icon} size={44} color={colors.primary} />
        </View>

        <View style={{ width: "100%", marginBottom: 12 }}>
          <PillButton
            label={t("lockScreen.unlockWith", { biometric: t(`biometrics.${biometric.key}`) })}
            variant="gradient"
            loading={unlocking}
            onPress={tryUnlock}
          />
        </View>
        <PillButton label={t("lockScreen.useOtherAccount")} variant="outline" onPress={switchAccount} />
      </View>
    </SafeAreaView>
  );
}
