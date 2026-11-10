// Fixed time zone: a date rendered on the server (UTC in Docker) reads the
// same as one rendered in a French browser.
const TIME_ZONE = "Europe/Paris";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const RELATIVE = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "12 juin 2025" (empty for a draft never published). */
export function formatArticleDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return DATE.format(new Date(iso));
}

/** "à l'instant", "il y a 5 minutes", "hier"… then the date after a week. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < MINUTE) return "à l’instant";
  if (elapsed < HOUR) return RELATIVE.format(-Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return RELATIVE.format(-Math.floor(elapsed / HOUR), "hour");
  if (elapsed < 7 * DAY) return RELATIVE.format(-Math.floor(elapsed / DAY), "day");
  return formatArticleDate(iso);
}

export const readTimeLabel = (minutes: number) => `${minutes} min`;

export const initialOf = (name: string) =>
  (name.trim().charAt(0) || "?").toUpperCase();
