import { describe, expect, it } from "vitest";
import sv from "../messages/sv.json";
import en from "../messages/en.json";

/** All leaf key paths, e.g. "admin.profiles.opt.days". */
function leafPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    leafPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("translation catalogs", () => {
  const svKeys = leafPaths(sv).sort();
  const enKeys = leafPaths(en).sort();

  it("sv and en have exactly the same key set", () => {
    const onlyInSv = svKeys.filter((k) => !enKeys.includes(k));
    const onlyInEn = enKeys.filter((k) => !svKeys.includes(k));
    expect({ onlyInSv, onlyInEn }).toEqual({ onlyInSv: [], onlyInEn: [] });
  });

  it("no empty string values", () => {
    const empties = [
      ...leafPaths(sv).filter((p) => resolve(sv, p) === ""),
      ...leafPaths(en).filter((p) => resolve(en, p) === ""),
    ];
    expect(empties).toEqual([]);
  });
});

function resolve(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], obj);
}
