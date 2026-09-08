export const TZ = process.env.TZ || "Europe/Stockholm";

const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" for the given instant in the dashboard timezone. */
export function dateKey(date: Date = new Date(), tz: string = TZ): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayKey(tz: string = TZ): string {
  return dateKey(new Date(), tz);
}

/** Parse a "YYYY-MM-DD" key to a Date at UTC midnight. All day math stays in UTC. */
export function keyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function addDays(key: string, days: number): string {
  return new Date(keyToDate(key).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** 0 = Monday .. 6 = Sunday for a date key. */
export function weekdayIndex(key: string): number {
  return (keyToDate(key).getUTCDay() + 6) % 7;
}

/** Monday (as a "YYYY-MM-DD" key) of the ISO week containing `key`. */
export function weekStart(key: string): string {
  return addDays(key, -weekdayIndex(key));
}

/** The seven keys Mon..Sun for the week containing `key`. */
export function weekDays(key: string): string[] {
  const monday = weekStart(key);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** ISO 8601 week number (1–53). */
export function isoWeek(key: string): number {
  const d = keyToDate(key);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3); // Thursday of this ISO week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const ftDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ftDay + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * DAY_MS));
}
