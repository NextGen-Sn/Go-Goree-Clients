const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const MONTH_NAMES = [
  "Jan",
  "Fév",
  "Mars",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export interface DateLabel {
  iso: string;
  label: string;
  weekday: string;
  dayNumber: number;
  monthShort: string;
  isToday: boolean;
}

/** `iso` doit être au format "YYYY-MM-DD" (celui renvoyé par l'API, ex. voyage.date_voyage). */
export function describeDate(iso: string): DateLabel {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);

  let label: string;
  if (diffDays === 0) label = "Aujourd'hui";
  else if (diffDays === 1) label = "Demain";
  else label = `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;

  return {
    iso,
    label,
    weekday: DAY_NAMES[date.getDay()],
    dayNumber: date.getDate(),
    monthShort: MONTH_NAMES[date.getMonth()],
    isToday: diffDays === 0,
  };
}

/** L'API renvoie l'heure de départ au format "HH:mm:ss" (colonne SQL TIME). */
/**
 * "14:00:00" -> "14:00".
 *
 * Accepte null/undefined : le trajet d'un voyage peut manquer (supprimé côté
 * admin), et un horaire absent doit s'afficher au lieu de faire échouer le
 * rendu de l'écran entier.
 */
export function formatHeureDepart(heureDepart: string | null | undefined): string {
  if (!heureDepart) return "—";
  return heureDepart.slice(0, 5);
}

/**
 * Nombre de jours entiers restants avant une échéance.
 *
 * Comparaison de dates calendaires, pas d'horodatages : un abonnement qui
 * expire ce soir doit afficher son dernier jour, pas « 0 » au motif qu'il reste
 * moins de vingt-quatre heures.
 */
export function joursRestants(iso: string): number {
  const jour = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = jour(new Date(iso)) - jour(new Date());
  return Math.max(0, Math.round(diff / 86_400_000));
}

/** Horaire brut d'un voyage, chaîne vide si le trajet manque — utile pour trier. */
export function heureDepartBrute(voyage: { trajet: { heure_depart: string } | null }): string {
  return voyage.trajet?.heure_depart ?? "";
}

/** Date du jour au format "YYYY-MM-DD", en heure locale (pas d'UTC-shift via toISOString). */
export function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
