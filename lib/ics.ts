import ical, {
  type CalendarComponent,
  type CalendarResponse,
  type VEvent,
} from "node-ical";

export interface ParsedEvent {
  externalId: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location: string | null;
  notes: string | null;
}

const DAY_MS = 86_400_000;

function isVEvent(c: CalendarComponent | undefined): c is VEvent {
  return c?.type === "VEVENT";
}

type Dateish = string | number | Date;

function asText(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  if (typeof v === "object" && "val" in (v as Record<string, unknown>)) {
    const val = (v as { val: unknown }).val;
    return val ? String(val) : null;
  }
  return String(v) || null;
}

/**
 * Fetch an ICS feed and return concrete event instances overlapping
 * [windowStart, windowEnd]. Recurring events are expanded; RECURRENCE-ID
 * overrides and EXDATEs are respected. Good enough for a family calendar;
 * not a full RFC 5545 implementation.
 */
export async function fetchIcsEvents(
  url: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<ParsedEvent[]> {
  return expandCalendar(await ical.async.fromURL(url), windowStart, windowEnd);
}

/** Same as {@link fetchIcsEvents} but from raw ICS text (used in tests). */
export function parseIcsEvents(
  text: string,
  windowStart: Date,
  windowEnd: Date,
): ParsedEvent[] {
  return expandCalendar(ical.sync.parseICS(text), windowStart, windowEnd);
}

function expandCalendar(
  data: CalendarResponse,
  windowStart: Date,
  windowEnd: Date,
): ParsedEvent[] {
  const out: ParsedEvent[] = [];

  for (const component of Object.values(data)) {
    if (!isVEvent(component) || !component.start) continue;
    const ev = component;

    const uid = String(ev.uid ?? "");
    const allDay = ev.datetype === "date";
    const baseStart = new Date(ev.start);
    const baseEnd = ev.end
      ? new Date(ev.end)
      : new Date(baseStart.getTime() + (allDay ? DAY_MS : 3_600_000));
    const durationMs = Math.max(0, baseEnd.getTime() - baseStart.getTime());
    const title = asText(ev.summary) ?? "(utan titel)";
    const location = asText(ev.location);
    const notes = asText(ev.description);

    const push = (start: Date, end: Date, suffix?: string) => {
      if (end.getTime() < windowStart.getTime() || start.getTime() > windowEnd.getTime()) return;
      out.push({
        externalId: suffix ? `${uid}#${suffix}` : uid,
        title,
        start,
        end,
        allDay,
        location,
        notes,
      });
    };

    if (!ev.rrule) {
      push(baseStart, baseEnd);
      continue;
    }

    const exdates = new Set(
      Object.values(ev.exdate ?? {}).map((d) => new Date(d).toISOString().slice(0, 10)),
    );
    const overrides = ev.recurrences ?? {};

    for (const occ of ev.rrule.between(
      new Date(windowStart.getTime() - durationMs),
      windowEnd,
      true,
    )) {
      const dayKey = occ.toISOString().slice(0, 10);
      if (exdates.has(dayKey)) continue;

      const override = overrides[dayKey];
      if (override) {
        const os = new Date(override.start as Dateish);
        const oe = override.end
          ? new Date(override.end as Dateish)
          : new Date(os.getTime() + durationMs);
        push(os, oe, dayKey);
      } else {
        push(occ, new Date(occ.getTime() + durationMs), dayKey);
      }
    }
  }

  return out;
}
