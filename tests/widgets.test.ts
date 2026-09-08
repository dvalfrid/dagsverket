import { describe, expect, it } from "vitest";
import {
  DEFAULT_WIDGETS,
  SIZE_SPAN,
  WIDGET_SIZES,
  WIDGET_TYPES,
  parseWidgets,
} from "../lib/widgets";

describe("parseWidgets", () => {
  it("returns [] for null / empty / invalid JSON", () => {
    expect(parseWidgets(null)).toEqual([]);
    expect(parseWidgets("")).toEqual([]);
    expect(parseWidgets("{not json")).toEqual([]);
  });

  it("drops the whole array if any entry fails validation", () => {
    expect(parseWidgets(JSON.stringify([{ id: "a", type: "nope", size: "md" }]))).toEqual([]);
  });

  it("keeps valid entries and fills defaults", () => {
    const parsed = parseWidgets(
      JSON.stringify([{ id: "w1", type: "clock" }, { id: "w2", type: "calendar", size: "xl", options: { days: 30 } }]),
    );
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ id: "w1", type: "clock", size: "md", options: {} });
    expect(parsed[1]).toMatchObject({ id: "w2", type: "calendar", size: "xl", options: { days: 30 } });
  });

  it("rejects unknown option keys (strict schema)", () => {
    expect(parseWidgets(JSON.stringify([{ id: "w", type: "clock", options: { bogus: 1 } }]))).toEqual([]);
  });
});

describe("widget registry constants", () => {
  it("every size has a grid span", () => {
    for (const size of WIDGET_SIZES) {
      expect(SIZE_SPAN[size].col).toBeGreaterThan(0);
      expect(SIZE_SPAN[size].row).toBeGreaterThan(0);
    }
  });

  it("default layouts only reference known widget types and sizes", () => {
    for (const list of Object.values(DEFAULT_WIDGETS)) {
      for (const w of list) {
        expect(WIDGET_TYPES).toContain(w.type);
        expect(WIDGET_SIZES).toContain(w.size);
      }
      // ids must be unique within a layout
      expect(new Set(list.map((w) => w.id)).size).toBe(list.length);
    }
  });

  it("default layouts round-trip through parseWidgets unchanged", () => {
    for (const list of Object.values(DEFAULT_WIDGETS)) {
      expect(parseWidgets(JSON.stringify(list))).toEqual(list);
    }
  });
});
