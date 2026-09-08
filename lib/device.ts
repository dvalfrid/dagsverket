import type { Device, Profile } from "@prisma/client";
import { db } from "./db";
import { readDeviceId, writeDeviceId } from "./auth";

export type DeviceWithProfile = Device & {
  profile:
    | (Profile & {
        person: { id: string; name: string; color: string; avatarEmoji: string } | null;
      })
    | null;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

function makeCode(len = 6): string {
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = makeCode();
    const clash = await db.device.findUnique({ where: { pairingCode: code } });
    if (!clash) return code;
  }
  return makeCode(8);
}

const profileInclude = {
  profile: {
    include: {
      person: { select: { id: true, name: true, color: true, avatarEmoji: true } },
    },
  },
} as const;

/** Read-only: resolve the current device from the cookie. Safe in RSC. */
export async function resolveDevice(): Promise<DeviceWithProfile | null> {
  const id = await readDeviceId();
  if (!id) return null;
  return db.device.findUnique({ where: { id }, include: profileInclude });
}

/** Route-handler use: resolve or register the device, refreshing the cookie. */
export async function ensureDevice(userAgent?: string): Promise<DeviceWithProfile> {
  const id = await readDeviceId();
  if (id) {
    const existing = await db.device.findUnique({ where: { id }, include: profileInclude });
    if (existing) {
      await db.device.update({
        where: { id },
        data: { lastSeenAt: new Date(), userAgent: userAgent ?? existing.userAgent },
      });
      return existing;
    }
  }

  const created = await db.device.create({
    data: {
      pairingCode: await uniqueCode(),
      lastSeenAt: new Date(),
      userAgent,
    },
    include: profileInclude,
  });
  await writeDeviceId(created.id);
  return created;
}

/** Attach a device to a profile and clear its pairing code. */
export async function pairDevice(deviceId: string, profileId: string, name?: string) {
  return db.device.update({
    where: { id: deviceId },
    data: {
      profileId,
      name: name?.trim() || undefined,
      pairingCode: null,
      pairedAt: new Date(),
    },
    include: profileInclude,
  });
}
