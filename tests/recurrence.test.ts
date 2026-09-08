import { describe, expect, it } from "vitest";
import {
  maskLabel,
  occursOn,
  occurrencesInRange,
} from "../lib/recurrence";

// 2026-09-07 is a Monday.
const MON = "2026-09-07";
const SAT = "2026-09-12";
const SUN = "2026-09-13";

describe("occursOn", () => {
  it("daily is always true", () => {
    expect(occursOn({ recurrence: "daily", weekdaysMask: 0 }, SUN)).toBe(true);
  });

  it("weekdays excludes the weekend", () => {
    expect(occursOn({ recurrence: "weekdays", weekdaysMask: 0 }, MON)).toBe(true);
    expect(occursOn({ recurrence: "weekdays", weekdaysMask: 0 }, SAT)).toBe(false);
    expect(occursOn({ recurrence: "weekdays", weekdaysMask: 0 }, SUN)).toBe(false);
  });

  it("weekly / custom respect the bitmask (bit 0 = Monday)", () => {
    const monAndSat = 1 | 32;
    expect(occursOn({ recurrence: "weekly", weekdaysMask: monAndSat }, MON)).toBe(true);
    expect(occursOn({ recurrence: "custom", weekdaysMask: monAndSat }, SAT)).toBe(true);
    expect(occursOn({ recurrence: "weekly", weekdaysMask: monAndSat }, SUN)).toBe(false);
  });
});

describe("occurrencesInRange", () => {
  it("lists every matching day inclusive", () => {
    expect(
      occurrencesInRange({ recurrence: "custom", weekdaysMask: 1 | 8 }, MON, SUN),
    ).toEqual(["2026-09-07", "2026-09-10"]); // Mon + Thu
  });
});

describe("maskLabel", () => {
  it("renders Swedish short weekday names in order", () => {
    expect(maskLabel(1 | 4 | 16)).toBe("mån, ons, fre");
  });
});
