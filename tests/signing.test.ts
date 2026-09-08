import { beforeAll, describe, expect, it } from "vitest";
import { sign, unsign } from "../lib/signing";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-16-chars-long";
});

describe("cookie signing", () => {
  it("round-trips a value", async () => {
    const token = await sign("device-123");
    expect(token.startsWith("device-123.")).toBe(true);
    expect(await unsign(token)).toBe("device-123");
  });

  it("rejects a tampered value", async () => {
    const token = await sign("device-123");
    const tampered = token.replace("device-123", "device-999");
    expect(await unsign(tampered)).toBeNull();
  });

  it("rejects a tampered signature", async () => {
    const token = await sign("hello");
    expect(await unsign(token.slice(0, -1) + "X")).toBeNull();
  });

  it("rejects missing / malformed input", async () => {
    expect(await unsign(undefined)).toBeNull();
    expect(await unsign(null)).toBeNull();
    expect(await unsign("no-dot")).toBeNull();
  });

  it("signatures differ under a different secret", async () => {
    const a = await sign("x");
    process.env.AUTH_SECRET = "another-secret-at-least-16-chars";
    const b = await sign("x");
    process.env.AUTH_SECRET = "test-secret-at-least-16-chars-long";
    expect(a).not.toBe(b);
  });
});
