import { addDays } from "./dates";

export type DayRelation = "today" | "tomorrow" | "yesterday" | "other";

/** How a "YYYY-MM-DD" key relates to a reference "today" key. */
export function dayRelation(key: string, todayKey: string): DayRelation {
  if (key === todayKey) return "today";
  if (key === addDays(todayKey, 1)) return "tomorrow";
  if (key === addDays(todayKey, -1)) return "yesterday";
  return "other";
}

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** i18n message key ("weekday.mon" etc.) for a date key. */
export function weekdayMessageKey(key: string): (typeof WEEKDAY_KEYS)[number] {
  const jsDay = new Date(`${key}T00:00:00.000Z`).getUTCDay();
  return WEEKDAY_KEYS[(jsDay + 6) % 7];
}

export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
