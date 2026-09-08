import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  profileId: z.string().nullable().optional(),
});

export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  const { name, profileId } = await readJson(req, patchSchema);
  const device = await db.device.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(profileId !== undefined
        ? { profileId, pairedAt: profileId ? new Date() : null }
        : {}),
    },
  });
  publish("devices");
  return ok(device);
}, { admin: true });

export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  await db.device.delete({ where: { id } });
  publish("devices");
  return ok({ ok: true });
}, { admin: true });
