import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { colors, gradients } from "@/constants/theme";
import { TripPickerModal } from "@/components/TripPickerModal";
import { ROUTE, formatFcfa } from "@/constants/trip";
import { CATEGORIE_LABELS, CATEGORIE_ICONS } from "@/constants/categorie";
import { TripSelection } from "@/types/voyage";
import { useTarifs } from "@/hooks/useTarifs";
import { useAuth } from "@/hooks/useAuth";

export default function NewTicketScreen() {
  const { user } = useAuth();
  // Résident avec abonnement actif : le billet est offert par l'abonnement,
  // aucun tarif ni paiement à choisir (le backend génère un billet gratuit).
  const isFree = user?.abonnement?.actif ?? false;
  const estResident = user?.estResident ?? false;

  const { data: tarifs, isLoading, isError } = useTarifs();
  const [selectedTarifId, setSelectedTarifId] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [trip, setTrip] = useState<TripSelection | null>(null);

  // Tarifs visibles selon le statut : un résident ne voit que le tarif RESIDENT ;
  // un client normal voit les tarifs grand public (enfant/adulte/étranger) et
  // jamais le tarif résident. Le backend applique la même règle à l'achat.
  const visibleTarifs = useMemo(() => {
    if (!tarifs) return [];
    return estResident
      ? tarifs.filter((t) => t.categorie === "RESIDENT")
      : tarifs.filter((t) => t.categorie !== "RESIDENT");
  }, [tarifs, estResident]);

  useEffect(() => {
    if (visibleTarifs.length > 0 && !visibleTarifs.some((t) => t.id === selectedTarifId)) {
      setSelectedTarifId(visibleTarifs[0].id);
    }
  }, [visibleTarifs, selectedTarifId]);

  const selected = visibleTarifs.find((t) => t.id === selectedTarifId) ?? null;

  function handleConfirmTrip(selection: TripSelection) {
    setTrip(selection);
    setPickerVisible(false);
  }

  function handlePay() {
    if (!trip) {
      setPickerVisible(true);
      return;
    }
    if (isFree) {
      router.push({
        pathname: "/ticket/payment",
        params: {
          voyageId: trip.voyage.id,
          free: "1",
          passengerLabel: "Résident abonné",
          total: "0",
          date: `${trip.dateLabel} • ${trip.timeLabel}`,
        },
      });
      return;
    }
    if (!selected) return;
    router.push({
      pathname: "/ticket/payment",
      params: {
        voyageId: trip.voyage.id,
        categorie: selected.categorie,
        passengerLabel: CATEGORIE_LABELS[selected.categorie],
        total: String(Number(selected.prix)),
        date: `${trip.dateLabel} • ${trip.timeLabel}`,
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
              backgroundColor: trip ? colors.inputBg : colors.primaryTint,
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
            <Text style={[styles.fieldText, !trip && { color: colors.primary }]}>
              {trip ? `${trip.dateLabel} • ${trip.timeLabel}` : "Choisir le voyage"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={trip ? colors.textGray : colors.primary} />
        </Pressable>

        <Text style={[styles.label, { marginBottom: 4 }]}>Passager</Text>
        <Text style={{ fontSize: 12, color: colors.textGray, marginBottom: 12 }}>
          Ce billet est valable pour 1 personne.
        </Text>

        {isFree ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#DCFCE7",
              borderRadius: 16,
              padding: 16,
              marginBottom: 32,
            }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "#16A34A", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Ionicons name="ribbon" size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#166534" }}>Billet gratuit</Text>
              <Text style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                Offert par votre abonnement résident.
              </Text>
            </View>
          </View>
        ) : isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <Text style={{ fontSize: 13, color: colors.textGray, marginBottom: 24 }}>
            Impossible de charger les tarifs.
          </Text>
        ) : (
          <View style={{ marginBottom: 32 }}>
            {visibleTarifs.map((tarif, i) => {
              const isSelected = selectedTarifId === tarif.id;
              return (
                <Pressable
                  key={tarif.id}
                  onPress={() => setSelectedTarifId(tarif.id)}
                  style={[
                    styles.passengerCard,
                    i < visibleTarifs.length - 1 && { marginBottom: 12 },
                    isSelected && styles.passengerCardSelected,
                  ]}
                >
                  <View style={[styles.passengerIcon, isSelected && styles.passengerIconSelected]}>
                    <Ionicons
                      name={CATEGORIE_ICONS[tarif.categorie]}
                      size={20}
                      color={isSelected ? colors.white : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passengerLabel}>{CATEGORIE_LABELS[tarif.categorie]}</Text>
                    <Text style={styles.passengerPrice}>{formatFcfa(Number(tarif.prix))}</Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.textGray }}>
            1 billet • {isFree ? "Résident abonné" : selected ? CATEGORIE_LABELS[selected.categorie] : "—"}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: isFree ? "#16A34A" : colors.textDark }}>
            {isFree ? "Gratuit" : selected ? formatFcfa(Number(selected.prix)) : "—"}
          </Text>
        </View>

        <Pressable onPress={handlePay} disabled={!isFree && !selected}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 54,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              opacity: isFree || selected ? 1 : 0.6,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.white }}>
              {!isFree && !selected
                ? "Chargement des tarifs..."
                : !trip
                  ? "Choisir le voyage pour continuer"
                  : isFree
                    ? "Réserver mon billet gratuit"
                    : `Payer ${formatFcfa(Number(selected!.prix))}`}
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
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  passengerCardSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
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
  passengerIconSelected: {
    backgroundColor: colors.primary,
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
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
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
};
