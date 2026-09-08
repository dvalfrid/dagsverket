import { describe, expect, it } from "vitest";
import { layoutDay } from "../lib/calendarLayout";

const ev = (id: string, start: string, end: string) => ({ id, start, end });

describe("layoutDay", () => {
  it("gives non-overlapping events a single full-width lane", () => {
    const placed = layoutDay([
      ev("a", "2026-09-09T08:00", "2026-09-09T09:00"),
      ev("b", "2026-09-09T10:00", "2026-09-09T11:00"),
    ]);
    expect(placed.map((p) => [p.e.id, p.lane, p.lanes])).toEqual([
      ["a", 0, 1],
      ["b", 0, 1],
    ]);
  });

  it("splits two overlapping events into two lanes", () => {
    const placed = layoutDay([
      ev("a", "2026-09-09T08:00", "2026-09-09T10:00"),
      ev("b", "2026-09-09T09:00", "2026-09-09T11:00"),
    ]);
    expect(placed.find((p) => p.e.id === "a")).toMatchObject({ lane: 0, lanes: 2 });
    expect(placed.find((p) => p.e.id === "b")).toMatchObject({ lane: 1, lanes: 2 });
  });

  it("reuses a lane once the earlier event has ended", () => {
    const placed = layoutDay([
      ev("a", "2026-09-09T08:00", "2026-09-09T09:00"),
      ev("b", "2026-09-09T08:30", "2026-09-09T09:30"),
      ev("c", "2026-09-09T09:00", "2026-09-09T10:00"),
    ]);
    // a & b overlap → 2 lanes; c starts when a ends → lane 0, cluster still spans b
    const byId = Object.fromEntries(placed.map((p) => [p.e.id, p]));
    expect(byId.a.lanes).toBe(2);
    expect(byId.c.lane).toBe(0);
  });

  it("keeps unrelated clusters independent (busy morning doesn't shrink the afternoon)", () => {
    const placed = layoutDay([
      ev("m1", "2026-09-09T08:00", "2026-09-09T10:00"),
      ev("m2", "2026-09-09T08:30", "2026-09-09T09:30"),
      ev("pm", "2026-09-09T14:00", "2026-09-09T15:00"),
    ]);
    expect(placed.find((p) => p.e.id === "pm")).toMatchObject({ lane: 0, lanes: 1 });
  });
});
