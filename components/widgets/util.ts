/** "YYYY-MM-DD" for an ISO timestamp in the viewer's local timezone. */
export function localDayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function groupByDay<T extends { start: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = localDayKey(item.start);
    (map.get(key) ?? map.set(key, []).get(key)!).push(item);
  }
  return map;
}
