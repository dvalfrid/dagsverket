import { describe, expect, it } from "vitest";
import { addDays, isoWeek, weekDays, weekStart, weekdayIndex } from "../lib/dates";

describe("date keys", () => {
  it("addDays crosses months and years", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("weekdayIndex is Monday-first", () => {
    expect(weekdayIndex("2026-09-07")).toBe(0); // Monday
    expect(weekdayIndex("2026-09-13")).toBe(6); // Sunday
  });

  it("weekStart returns the Monday", () => {
    expect(weekStart("2026-09-08")).toBe("2026-09-07");
    expect(weekStart("2026-09-07")).toBe("2026-09-07");
    expect(weekStart("2026-09-13")).toBe("2026-09-07");
  });

  it("weekDays returns Mon..Sun", () => {
    expect(weekDays("2026-09-09")).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
    ]);
  });

  it("isoWeek matches known values", () => {
    expect(isoWeek("2026-09-08")).toBe(37);
    expect(isoWeek("2026-01-01")).toBe(1);
    expect(isoWeek("2025-12-29")).toBe(1); // ISO week belongs to 2026
  });
});
