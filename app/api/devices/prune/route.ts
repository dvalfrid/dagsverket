import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok } from "@/lib/http";

/** Delete every device still waiting to be paired (no profile assigned). */
export const POST = handler(
  async () => {
    const { count } = await db.device.deleteMany({ where: { profileId: null } });
    publish("devices");
    return ok({ removed: count });
  },
  { admin: true },
);
