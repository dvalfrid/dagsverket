/**
 * HMAC-SHA256 value signing for cookies. No Next.js imports so it can be unit
 * tested in isolation. Works in the edge and node runtimes (Web Crypto).
 */

const enc = new TextEncoder();

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET is missing or shorter than 16 characters");
  }
  return s;
}

function b64url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString("base64url");
}

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return b64url(sig);
}

/** `value.<hmac>` — so we can trust the value when it comes back in a request. */
export async function sign(value: string): Promise<string> {
  return `${value}.${await hmac(value)}`;
}

/** Returns the original value if the signature checks out, else null. */
export async function unsign(signed: string | undefined | null): Promise<string | null> {
  if (!signed) return null;
  const dot = signed.lastIndexOf(".");
  if (dot < 1) return null;
  const value = signed.slice(0, dot);
  const sig = signed.slice(dot + 1);
  const expected = await hmac(value);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? value : null;
}
