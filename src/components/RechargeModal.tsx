import { useState } from "react";
import { Modal, View, Text, Image, Pressable, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients } from "@/constants/theme";
import { formatFcfa } from "@/constants/trip";

const AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

const METHODS = [
  { id: "wave", label: "Wave", logo: require("../../assets/payment-logos/wave.png") },
  { id: "orange", label: "Orange Money", logo: require("../../assets/payment-logos/orange-money.png") },
  { id: "yas", label: "Yas", logo: require("../../assets/payment-logos/yas.png") },
];

interface RechargeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: string) => void;
  initialAmount?: number | null;
}

export function RechargeModal({ visible, onClose, onConfirm, initialAmount }: RechargeModalProps) {
  const [amount, setAmount] = useState<number | null>(initialAmount ?? null);
  const [method, setMethod] = useState<string>("wave");

  useEffect(() => {
    if (visible) setAmount(initialAmount ?? null);
  }, [visible, initialAmount]);

  function handleConfirm() {
    if (!amount) return;
    const methodLabel = METHODS.find((m) => m.id === method)?.label ?? method;
    onConfirm(amount, methodLabel);
    setAmount(null);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheet}>
          <SafeAreaView edges={["bottom"]}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <View style={styles.headerIconBadge}>
                <Ionicons name="wallet" size={18} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Recharger mon portefeuille</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.sectionLabel}>Montant</Text>
              <View style={styles.amountGrid}>
                {AMOUNTS.map((value) => {
                  const isSelected = amount === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      activeOpacity={0.7}
                      onPress={() => setAmount(value)}
                      style={[styles.amountChip, isSelected && styles.amountChipSelected]}
                    >
                      <Text style={[styles.amountChipText, isSelected && styles.amountChipTextSelected]}>
                        {formatFcfa(value)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Mode de paiement</Text>
              {METHODS.map((m) => {
                const isSelected = method === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    activeOpacity={0.7}
                    onPress={() => setMethod(m.id)}
                    style={[styles.methodRow, isSelected && styles.methodRowSelected]}
                  >
                    <View style={styles.methodBadge}>
                      <Image source={m.logo} style={{ width: 32, height: 32 }} resizeMode="contain" />
                    </View>
                    <Text style={styles.methodLabel}>{m.label}</Text>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Pressable onPress={handleConfirm} disabled={!amount} style={{ marginTop: 12 }}>
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.confirmButton, !amount && { opacity: 0.5 }]}
                >
                  <Text style={styles.confirmButtonText}>
                    {amount ? `Recharger ${formatFcfa(amount)}` : "Choisir un montant"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "82%",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textGray,
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  amountChip: {
    width: "31%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: "transparent",
    marginBottom: 12,
  },
  amountChipSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  amountChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textDark,
  },
  amountChipTextSelected: {
    color: colors.primary,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 12,
  },
  methodRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  methodBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  methodLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  confirmButton: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
});
