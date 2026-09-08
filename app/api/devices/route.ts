import { db } from "@/lib/db";
import { handler, ok } from "@/lib/http";

export const GET = handler(async () => {
  const devices = await db.device.findMany({
    orderBy: [{ pairedAt: "asc" }, { createdAt: "asc" }],
    include: { profile: { select: { id: true, name: true, type: true } } },
  });
  return ok({
    pending: devices.filter((d) => !d.profileId),
    paired: devices.filter((d) => d.profileId),
  });
}, { admin: true });
