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

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isRecharge = transaction.type === "recharge";

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
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isRecharge ? "#DCFCE7" : colors.inputBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons
          name={isRecharge ? "arrow-down" : "arrow-up"}
          size={18}
          color={isRecharge ? "#16A34A" : colors.textDark}
        />
      </View>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textDark }}>
          {transaction.label}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textGray, marginTop: 2 }}>
          {transaction.method} • {new Date(transaction.date).toLocaleDateString("fr-FR")}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "800",
          color: isRecharge ? "#16A34A" : colors.textDark,
        }}
      >
        {isRecharge ? "+" : ""}
        {formatFcfa(transaction.amount)}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const { balance, transactions, recharge } = useWallet();
  const [modalVisible, setModalVisible] = useState(false);

  function handleConfirmRecharge(amount: number, method: string) {
    recharge(amount, method);
    setModalVisible(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textDark }}>Wallet</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 24,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                Solde disponible
              </Text>
              <Text style={{ fontSize: 32, fontWeight: "800", color: colors.white, marginBottom: 20 }}>
                {formatFcfa(balance)}
              </Text>

              <Pressable onPress={() => setModalVisible(true)}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.white,
                    borderRadius: 14,
                    height: 48,
                  }}
                >
                  <Ionicons name="add-circle" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
                    Recharger
                  </Text>
                </View>
              </Pressable>
            </LinearGradient>

            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textDark, marginBottom: 4 }}>
              Historique des transactions
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
      />
    </SafeAreaView>
  );
}
