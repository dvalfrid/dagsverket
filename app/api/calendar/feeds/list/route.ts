import { db } from "@/lib/db";
import { handler, ok } from "@/lib/http";

/** Public, minimal feed list (id/name/color) for the calendar widget's toggles. */
export const GET = handler(async () => {
  const feeds = await db.calendarFeed.findMany({
    where: { enabled: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, color: true },
  });
  return ok(feeds);
});
