import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { colors, gradients } from "@/constants/theme";
import { Stepper } from "@/components/ui/Stepper";
import { TripPickerModal } from "@/components/TripPickerModal";
import {
  ROUTE,
  ADULT_PRICE,
  CHILD_PRICE,
  FOREIGNER_PRICE,
  formatFcfa,
  TripDate,
} from "@/constants/trip";

const DEFAULT_SEATS = 150;

export default function TicketsScreen() {
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [foreigners, setForeigners] = useState(0);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [trip, setTrip] = useState<{ date: TripDate; time: string } | null>(null);

  const total = adults * ADULT_PRICE + children * CHILD_PRICE + foreigners * FOREIGNER_PRICE;
  const passengers = adults + children + foreigners;
  const seatsAvailable = trip?.date.seatsAvailable ?? DEFAULT_SEATS;

  function handleConfirmTrip(selection: { date: TripDate; time: string }) {
    setTrip(selection);
    setPickerVisible(false);
  }

  function handlePay() {
    if (!trip) {
      setPickerVisible(true);
      return;
    }
    router.push({
      pathname: "/ticket/payment",
      params: {
        adults: String(adults),
        children: String(children),
        foreigners: String(foreigners),
        total: String(total),
        date: `${trip.date.label} • ${trip.time}`,
      },
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <Pressable onPress={() => router.canGoBack() && router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.textDark} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textDark, marginLeft: 12 }}>
          Acheter un billet (Aller-Retour)
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", marginBottom: 24 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.label}>Départ</Text>
            <View style={styles.field}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                  marginRight: 8,
                }}
              />
              <Text style={styles.fieldText}>{ROUTE.departure}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Destination</Text>
            <View style={styles.field}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.primaryLight,
                  marginRight: 8,
                }}
              />
              <Text style={styles.fieldText}>{ROUTE.destination}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.label}>Voyage</Text>
        <Pressable
          onPress={() => setPickerVisible(true)}
          style={[
            styles.field,
            {
              marginBottom: 24,
              justifyContent: "space-between",
              backgroundColor: trip ? colors.inputBg : "#EFF4FF",
              borderWidth: trip ? 0 : 1,
              borderColor: colors.primary,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={trip ? colors.textGray : colors.primary}
              style={{ marginRight: 10 }}
            />
            <Text
              style={[
                styles.fieldText,
                !trip && { color: colors.primary },
              ]}
            >
              {trip ? `${trip.date.label} • ${trip.time}` : "Choisir le voyage"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={trip ? colors.textGray : colors.primary} />
        </Pressable>

        <Text style={[styles.label, { marginBottom: 12 }]}>Passagers</Text>

        <View style={{ marginBottom: 24 }}>
          <View style={[styles.passengerCard, { marginBottom: 12 }]}>
            <View style={styles.passengerIcon}>
              <Ionicons name="happy-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passengerLabel}>Enfant</Text>
              <Text style={styles.passengerPrice}>{formatFcfa(CHILD_PRICE)}</Text>
            </View>
            <Stepper value={children} onChange={setChildren} min={0} />
          </View>

          <View style={[styles.passengerCard, { marginBottom: 12 }]}>
            <View style={styles.passengerIcon}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passengerLabel}>Adulte résident</Text>
              <Text style={styles.passengerPrice}>{formatFcfa(ADULT_PRICE)}</Text>
            </View>
            <Stepper value={adults} onChange={setAdults} min={1} />
          </View>

          <View style={styles.passengerCard}>
            <View style={styles.passengerIcon}>
              <Ionicons name="globe-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passengerLabel}>Étranger</Text>
              <Text style={styles.passengerPrice}>{formatFcfa(FOREIGNER_PRICE)}</Text>
            </View>
            <Stepper value={foreigners} onChange={setForeigners} min={0} />
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#22C55E",
              marginRight: 6,
            }}
          />
          <Text style={{ fontSize: 13, color: colors.textGray }}>
            {seatsAvailable} places disponibles
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.textGray }}>
            {passengers} passager{passengers > 1 ? "s" : ""}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textDark }}>
            {formatFcfa(total)}
          </Text>
        </View>

        <Pressable onPress={handlePay}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>
              {trip ? `Payer ${formatFcfa(total)}` : "Choisir le voyage pour continuer"}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>

      <TripPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConfirm={handleConfirmTrip}
      />
    </SafeAreaView>
  );
}

const styles = {
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textGray,
    marginBottom: 6,
  },
  field: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  fieldText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textDark,
  },
  passengerCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    padding: 12,
  },
  passengerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  passengerLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: colors.textDark,
  },
  passengerPrice: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.primary,
    marginTop: 1,
  },
};
