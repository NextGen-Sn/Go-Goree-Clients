import { useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients } from "@/constants/theme";
import { useWallet } from "@/hooks/useWallet";
import { formatFcfa } from "@/constants/trip";
import { RechargeModal } from "@/components/RechargeModal";
import { Transaction } from "@/types";

const QUICK_AMOUNTS = [2000, 5000, 10000, 20000];

function methodBadge(method: string) {
  const key = method.toLowerCase();
  if (key.includes("wave")) return { bg: "#1D9BF0", text: "W" };
  if (key.includes("orange")) return { bg: "#FF7900", text: "OM" };
  if (key.includes("yas")) return { bg: "#FFC800", text: "Y" };
  return { bg: colors.textGray, text: method.slice(0, 1).toUpperCase() };
}

function formatRelativeDateTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return `Aujourd'hui, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Hier, ${time}`;
  return `${date.toLocaleDateString("fr-FR")}, ${time}`;
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isRecharge = transaction.type === "recharge";
  const badge = methodBadge(transaction.method);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {isRecharge ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: badge.bg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: "800", fontSize: 13 }}>
            {badge.text}
          </Text>
        </View>
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primaryTint,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="boat" size={18} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textDark }}>
          {transaction.label}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textGray, marginTop: 2 }}>
          {transaction.method} • {formatRelativeDateTime(transaction.date)}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "800",
          color: isRecharge ? "#16A34A" : colors.primary,
        }}
      >
        {isRecharge ? "+" : "-"}
        {formatFcfa(Math.abs(transaction.amount))}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const { balance, transactions, recharge } = useWallet();
  const [modalVisible, setModalVisible] = useState(false);
  const [presetAmount, setPresetAmount] = useState<number | null>(null);
  const [balanceHidden, setBalanceHidden] = useState(false);

  function handleConfirmRecharge(amount: number, method: string) {
    recharge(amount, method);
    setModalVisible(false);
  }

  function openRecharge(amount: number | null) {
    setPresetAmount(amount);
    setModalVisible(true);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.white, marginBottom: 20 }}>
              Mon portefeuille
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  color: "rgba(255,255,255,0.8)",
                  marginRight: 8,
                }}
              >
                SOLDE DISPONIBLE
              </Text>
              <Pressable onPress={() => setBalanceHidden((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={balanceHidden ? "eye-off-outline" : "eye-outline"}
                  size={15}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            </View>
            <Text style={{ fontSize: 32, fontWeight: "800", color: colors.white, marginBottom: 20 }}>
              {balanceHidden ? "•••• FCFA" : formatFcfa(balance)}
            </Text>

            <Pressable onPress={() => openRecharge(null)}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.22)",
                  borderRadius: 26,
                  height: 48,
                }}
              >
                <Ionicons name="add" size={18} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.white }}>
                  Recharger
                </Text>
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        ListHeaderComponent={
          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textDark, marginBottom: 12 }}>
              Montants rapides
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 24 }}>
              {QUICK_AMOUNTS.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => openRecharge(value)}
                  style={{
                    paddingHorizontal: 16,
                    height: 38,
                    borderRadius: 19,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textDark }}>
                    {formatFcfa(value)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textDark, marginBottom: 4 }}>
              Dernières transactions
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ fontSize: 14, color: colors.textGray, marginTop: 12 }}>
            Aucune transaction pour l'instant.
          </Text>
        }
      />

      <RechargeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmRecharge}
        initialAmount={presetAmount}
      />
    </View>
  );
}
