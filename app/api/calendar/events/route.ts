import { db } from "@/lib/db";
import { handler, ok } from "@/lib/http";
import { todayKey, addDays, keyToDate } from "@/lib/dates";

/** Calendar events overlapping [from, to] (defaults: today .. +14 days). */
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const today = todayKey();
  const from = url.searchParams.get("from") ?? today;
  const to = url.searchParams.get("to") ?? addDays(today, 14);

  const fromDate = keyToDate(from);
  const toDate = new Date(keyToDate(to).getTime() + 86_400_000); // inclusive end day

  const events = await db.calendarEvent.findMany({
    where: { start: { lt: toDate }, end: { gte: fromDate } },
    orderBy: { start: "asc" },
    include: { feed: { select: { name: true, color: true } } },
  });

  return ok({
    range: { from, to, today },
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      allDay: e.allDay,
      location: e.location,
      notes: e.notes,
      color: e.feed?.color ?? "#6c8cff",
      feedId: e.feedId,
      feedName: e.feed?.name ?? null,
    })),
  });
});
