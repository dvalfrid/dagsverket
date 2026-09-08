import { addDays, weekdayIndex } from "./dates";

export type Recurrence = "daily" | "weekdays" | "weekly" | "custom";

export interface RecurringChore {
  recurrence: string;
  weekdaysMask: number;
}

/** Bit i (0 = Monday) set in the mask? */
export function maskHasDay(mask: number, weekday0Mon: number): boolean {
  return (mask & (1 << weekday0Mon)) !== 0;
}

/** Does the chore fall on the given "YYYY-MM-DD" key? */
export function occursOn(chore: RecurringChore, key: string): boolean {
  const wd = weekdayIndex(key);
  switch (chore.recurrence) {
    case "daily":
      return true;
    case "weekdays":
      return wd <= 4; // Mon–Fri
    case "weekly":
    case "custom":
      return maskHasDay(chore.weekdaysMask, wd);
    default:
      return false;
  }
}

/** Every date key in [fromKey, toKey] (inclusive) the chore occurs on. */
export function occurrencesInRange(
  chore: RecurringChore,
  fromKey: string,
  toKey: string,
): string[] {
  const out: string[] = [];
  for (let key = fromKey; key <= toKey; key = addDays(key, 1)) {
    if (occursOn(chore, key)) out.push(key);
  }
  return out;
}

const LABELS: Record<number, string> = {
  1: "mån",
  2: "tis",
  4: "ons",
  8: "tor",
  16: "fre",
  32: "lör",
  64: "sön",
};

/** Human summary of a mask, e.g. "mån, ons, fre". */
export function maskLabel(mask: number): string {
  return Object.entries(LABELS)
    .filter(([bit]) => (mask & Number(bit)) !== 0)
    .map(([, label]) => label)
    .join(", ");
}
