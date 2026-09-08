import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { pairDevice } from "@/lib/device";
import { handler, ok, bad, readJson } from "@/lib/http";

const schema = z.object({
  code: z.string().trim().min(4),
  profileId: z.string().min(1),
  name: z.string().trim().min(1).optional(),
});

export const POST = handler(
  async (req) => {
    const { code, profileId, name } = await readJson(req, schema);

    const device = await db.device.findUnique({
      where: { pairingCode: code.toUpperCase() },
    });
    if (!device) return bad("unknown-code", 404);

    const profile = await db.profile.findUnique({ where: { id: profileId } });
    if (!profile) return bad("unknown-profile", 404);

    const updated = await pairDevice(device.id, profileId, name);
    publish("devices");
    return ok({ id: updated.id, name: updated.name, profileId });
  },
  { admin: true },
);
