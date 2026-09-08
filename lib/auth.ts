import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { sign, unsign } from "./signing";

export { sign, unsign };

const DEVICE_COOKIE = "dv_device";
const ADMIN_COOKIE = "dv_admin";
const ADMIN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEVICE_TTL_S = 400 * 24 * 60 * 60; // ~13 months

/**
 * Only mark cookies `Secure` when the request actually arrived over HTTPS.
 * A NAS deployment is typically plain HTTP on the LAN — a `Secure` cookie there
 * is silently dropped by the browser, which made every /pair poll mint a brand
 * new unpaired Device. Honour `x-forwarded-proto` for reverse-proxy setups.
 */
async function requestIsHttps(): Promise<boolean> {
  try {
    const h = await headers();
    const proto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim().toLowerCase();
    if (proto) return proto === "https";
    return (h.get("x-forwarded-ssl") ?? "").toLowerCase() === "on";
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Device cookie                                                       */
/* ------------------------------------------------------------------ */

export async function readDeviceId(): Promise<string | null> {
  const jar = await cookies();
  return unsign(jar.get(DEVICE_COOKIE)?.value);
}

export async function writeDeviceId(deviceId: string): Promise<void> {
  const jar = await cookies();
  jar.set(DEVICE_COOKIE, await sign(deviceId), {
    httpOnly: true,
    sameSite: "lax",
    secure: await requestIsHttps(),
    path: "/",
    maxAge: DEVICE_TTL_S,
  });
}

/* ------------------------------------------------------------------ */
/* Admin PIN + session                                                 */
/* ------------------------------------------------------------------ */

async function adminPinHash(): Promise<string> {
  const existing = await db.setting.findUnique({ where: { key: "admin_pin_hash" } });
  if (existing) return existing.value;

  const bootstrap = process.env.ADMIN_PIN;
  if (!bootstrap) throw new Error("No admin PIN set and ADMIN_PIN env is empty");
  const hash = await bcrypt.hash(bootstrap, 10);
  await db.setting.create({ data: { key: "admin_pin_hash", value: hash } });
  return hash;
}

export async function verifyPin(pin: string): Promise<boolean> {
  if (!pin) return false;
  return bcrypt.compare(pin, await adminPinHash());
}

export async function setPin(newPin: string): Promise<void> {
  if (!/^\d{4,10}$/.test(newPin)) throw new Error("PIN must be 4–10 digits");
  const hash = await bcrypt.hash(newPin, 10);
  await db.setting.upsert({
    where: { key: "admin_pin_hash" },
    update: { value: hash },
    create: { key: "admin_pin_hash", value: hash },
  });
}

export async function startAdminSession(): Promise<void> {
  const jar = await cookies();
  const expires = Date.now() + ADMIN_TTL_MS;
  jar.set(ADMIN_COOKIE, await sign(String(expires)), {
    httpOnly: true,
    sameSite: "lax",
    secure: await requestIsHttps(),
    path: "/",
    maxAge: Math.floor(ADMIN_TTL_MS / 1000),
  });
}

export async function endAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const value = await unsign(jar.get(ADMIN_COOKIE)?.value);
  if (!value) return false;
  const expires = Number(value);
  return Number.isFinite(expires) && expires > Date.now();
}

/** For route handlers: returns a 401 Response when not authenticated, else null. */
export async function requireAdmin(): Promise<Response | null> {
  return (await isAdmin())
    ? null
    : Response.json({ error: "unauthorized" }, { status: 401 });
}
