import { describe, expect, it } from "vitest";
import { parseIcsEvents } from "../lib/ics";

const ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//test//dagsverket//EN
BEGIN:VEVENT
UID:single-1
SUMMARY:Tandläkare
DTSTART:20260910T090000Z
DTEND:20260910T100000Z
LOCATION:Folktandvården
END:VEVENT
BEGIN:VEVENT
UID:weekly-1
SUMMARY:Fotbollsträning
DTSTART:20260908T170000Z
DTEND:20260908T183000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
EXDATE:20260915T170000Z
END:VEVENT
END:VCALENDAR`;

describe("parseIcsEvents", () => {
  const from = new Date("2026-09-01T00:00:00Z");
  const to = new Date("2026-10-01T00:00:00Z");
  const events = parseIcsEvents(ICS, from, to);

  it("includes the one-off event with its metadata", () => {
    const single = events.find((e) => e.externalId === "single-1");
    expect(single?.title).toBe("Tandläkare");
    expect(single?.location).toBe("Folktandvården");
    expect(single?.start.toISOString()).toBe("2026-09-10T09:00:00.000Z");
  });

  it("expands the weekly recurrence and honours EXDATE", () => {
    const weekly = events
      .filter((e) => e.externalId.startsWith("weekly-1"))
      .map((e) => e.start.toISOString().slice(0, 10))
      .sort();
    // Tuesdays in September 2026: 8, 15, 22, 29 — minus the 15th (EXDATE).
    expect(weekly).toEqual(["2026-09-08", "2026-09-22", "2026-09-29"]);
  });
});
