import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Billet } from "@/types/billet";
import { formatHeureDepart } from "@/utils/date";

// Combien de minutes avant le départ on prévient l'utilisateur.
const REMINDER_MINUTES = 30;
const PREFIX = "depart-reminder-";

// Affiche la notification même quand l'app est au premier plan.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionResolved: boolean | null = null;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (permissionResolved !== null) return permissionResolved;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    permissionResolved = true;
    return true;
  }
  const asked = await Notifications.requestPermissionsAsync();
  permissionResolved = asked.granted;
  return asked.granted;
}

async function ensureAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("departs", {
      name: "Rappels de départ",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/** Date/heure de départ réelle d'un billet, ou null si le voyage n'est pas chargé. */
function departureDate(billet: Billet): Date | null {
  if (!billet.voyage) return null;
  const [y, m, d] = billet.voyage.date_voyage.slice(0, 10).split("-").map(Number);
  const [hh, mm] = billet.voyage.trajet.heure_depart.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

/**
 * (Re)programme les rappels locaux de départ pour les billets PAYÉS à venir.
 * Idempotent : annule d'abord tous nos rappels puis reprogramme d'après l'état
 * courant (un billet annulé/passé n'est plus rappelé). Fonctionne en Expo Go
 * (notifications LOCALES ; le push distant, lui, nécessite une build de dev).
 */
export async function syncDepartureReminders(billets: Billet[]): Promise<void> {
  if (Platform.OS === "web") return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;
  await ensureAndroidChannel();

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => typeof n.identifier === "string" && n.identifier.startsWith(PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );

  const now = Date.now();
  for (const billet of billets) {
    if (billet.statut !== "PAYE") continue;
    const dep = departureDate(billet);
    if (!dep) continue;

    const remindAt = new Date(dep.getTime() - REMINDER_MINUTES * 60_000);
    if (remindAt.getTime() <= now) continue; // trop tard pour rappeler

    await Notifications.scheduleNotificationAsync({
      identifier: PREFIX + billet.id,
      content: {
        title: "Départ imminent 🚤",
        body: `Votre chaloupe Dakar ↔ Gorée part à ${formatHeureDepart(
          billet.voyage!.trajet.heure_depart
        )}. Rendez-vous à l'embarcadère.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: remindAt },
    });
  }
}
