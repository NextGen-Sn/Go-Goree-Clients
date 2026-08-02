import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors } from "@/constants/theme";
import { describeDate, formatHeureDepart, heureDepartBrute, DateLabel } from "@/utils/date";
import { useVoyages, UPCOMING_VOYAGES_PARAMS } from "@/hooks/useVoyages";
import { Voyage, TripSelection } from "@/types/voyage";

interface TripPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selection: TripSelection) => void;
}

type Step = "date" | "time";

export function TripPickerModal({ visible, onClose, onConfirm }: TripPickerModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("date");
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);

  const { data: voyages, isLoading, isError, refetch } = useVoyages(UPCOMING_VOYAGES_PARAMS);

  useEffect(() => {
    if (visible) {
      setStep("date");
      setSelectedDateIso(null);
    }
  }, [visible]);

  // Un voyage par créneau (trajet+jour), regroupés par date puis triés par heure.
  const dates: DateLabel[] = useMemo(() => {
    if (!voyages) return [];
    const uniqueDates = Array.from(new Set(voyages.map((v) => v.date_voyage))).sort();
    return uniqueDates.map(describeDate);
  }, [voyages]);

  const timeSlots: Voyage[] = useMemo(() => {
    if (!voyages || !selectedDateIso) return [];
    return voyages
      .filter((v) => v.date_voyage === selectedDateIso)
      .sort((a, b) => heureDepartBrute(a).localeCompare(heureDepartBrute(b)));
  }, [voyages, selectedDateIso]);

  const selectedDate = dates.find((d) => d.iso === selectedDateIso) ?? null;

  function handlePickDate(date: DateLabel) {
    setSelectedDateIso(date.iso);
    setStep("time");
  }

  function handlePickVoyage(voyage: Voyage) {
    if (voyage.places_restantes <= 0 || !selectedDate) return;
    onConfirm({
      voyage,
      dateLabel: selectedDate.label,
      timeLabel: formatHeureDepart(voyage.trajet?.heure_depart),
    });
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
              {step === "time" ? (
                <TouchableOpacity
                  onPress={() => setStep("date")}
                  hitSlop={12}
                  activeOpacity={0.7}
                  style={styles.headerIconBtn}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.textDark} />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerIconBadge}>
                  <Ionicons name="calendar" size={18} color={colors.primary} />
                </View>
              )}
              <View>
                <Text style={styles.headerTitle}>
                  {step === "date" ? t("dashboard.chooseDate") : t("dashboard.chooseTime")}
                </Text>
                {step === "time" && selectedDate && (
                  <Text style={styles.headerSubtitle}>{selectedDate.label}</Text>
                )}
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              {isLoading ? (
                <View style={styles.stateBlock}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.stateText}>{t("dashboard.loadingTrips")}</Text>
                </View>
              ) : isError ? (
                <View style={styles.stateBlock}>
                  <Text style={styles.stateText}>{t("dashboard.errorLoadingTrips")}</Text>
                  <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
                    <Text style={styles.retryBtnText}>{t("common.retry")}</Text>
                  </TouchableOpacity>
                </View>
              ) : step === "date" ? (
                dates.length === 0 ? (
                  <View style={styles.stateBlock}>
                    <Text style={styles.stateText}>{t("dashboard.noVoyage")}</Text>
                  </View>
                ) : (
                  dates.map((date) => (
                    <TouchableOpacity
                      key={date.iso}
                      activeOpacity={0.7}
                      onPress={() => handlePickDate(date)}
                      style={[styles.dateRow, date.isToday && styles.dateRowToday]}
                    >
                      <View style={[styles.dateBadge, date.isToday && styles.dateBadgeToday]}>
                        <Text style={[styles.dateBadgeNum, date.isToday && styles.dateBadgeTextToday]}>
                          {date.dayNumber}
                        </Text>
                        <Text style={[styles.dateBadgeMonth, date.isToday && styles.dateBadgeTextToday]}>
                          {date.monthShort}
                        </Text>
                      </View>

                      <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>{date.label}</Text>
                        <Text style={styles.dateWeekday}>{date.weekday}</Text>
                      </View>

                      <Ionicons name="chevron-forward" size={18} color={colors.textGray} />
                    </TouchableOpacity>
                  ))
                )
              ) : (
                <View>
                  {timeSlots.map((voyage) => {
                    const isFull = voyage.places_restantes <= 0;
                    return (
                      <TouchableOpacity
                        key={voyage.id}
                        activeOpacity={isFull ? 1 : 0.7}
                        disabled={isFull}
                        onPress={() => handlePickVoyage(voyage)}
                        style={[styles.timeRow, isFull && styles.timeRowFull]}
                      >
                        <View style={styles.timeIconBadge}>
                          <Ionicons name="time-outline" size={18} color={colors.primary} />
                        </View>
                        <Text style={styles.timeLabel}>
                          {formatHeureDepart(voyage.trajet?.heure_depart)}
                        </Text>
                        {isFull ? (
                          <Text style={styles.fullLabel}>{t("dashboard.complet")}</Text>
                        ) : (
                          <View style={styles.seatsBlock}>
                            <View style={styles.seatsRow}>
                              <View style={styles.seatsDot} />
                              <Text style={styles.seatsNum}>{voyage.places_restantes}</Text>
                            </View>
                            <Text style={styles.seatsLabel}>{t("dashboard.placesCount")}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
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
    maxHeight: "78%",
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
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
  headerSubtitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  stateBlock: {
    alignItems: "center",
    paddingVertical: 40,
  },
  stateText: {
    fontSize: 14,
    color: colors.textGray,
    marginTop: 12,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.primaryTint,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  dateRowToday: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  dateBadge: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dateBadgeToday: {
    backgroundColor: colors.primary,
  },
  dateBadgeNum: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
    lineHeight: 18,
  },
  dateBadgeMonth: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textGray,
  },
  dateBadgeTextToday: {
    color: colors.white,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textDark,
  },
  dateWeekday: {
    fontSize: 12,
    color: colors.textGray,
    marginTop: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  timeRowFull: {
    opacity: 0.5,
  },
  timeIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  timeLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
  },
  fullLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textGray,
  },
  seatsBlock: {
    alignItems: "flex-end",
  },
  seatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  seatsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 4,
  },
  seatsNum: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textDark,
  },
  seatsLabel: {
    fontSize: 10,
    color: colors.textGray,
    marginTop: 2,
  },
});
