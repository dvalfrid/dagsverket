import { db } from "./db";
import { publish } from "./bus";
import { fetchIcsEvents } from "./ics";

const DAY_MS = 86_400_000;
const PAST_WINDOW_DAYS = 14;
const FUTURE_WINDOW_DAYS = 120;

export async function syncFeed(feedId: string): Promise<{ count: number }> {
  const feed = await db.calendarFeed.findUnique({ where: { id: feedId } });
  if (!feed) throw new Error("feed not found");

  const now = Date.now();
  try {
    const events = await fetchIcsEvents(
      feed.url,
      new Date(now - PAST_WINDOW_DAYS * DAY_MS),
      new Date(now + FUTURE_WINDOW_DAYS * DAY_MS),
    );

    // Read-only mirror: replace this feed's events wholesale.
    await db.$transaction([
      db.calendarEvent.deleteMany({ where: { feedId: feed.id } }),
      ...events.map((e) =>
        db.calendarEvent.create({
          data: {
            feedId: feed.id,
            externalId: e.externalId,
            title: e.title,
            start: e.start,
            end: e.end,
            allDay: e.allDay,
            location: e.location,
            notes: e.notes,
            source: "ics",
          },
        }),
      ),
    ]);

    await db.calendarFeed.update({
      where: { id: feed.id },
      data: { lastSyncedAt: new Date(), lastError: null },
    });
    publish("calendar");
    return { count: events.length };
  } catch (err) {
    await db.calendarFeed.update({
      where: { id: feed.id },
      data: { lastError: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  }
}

export async function syncAllFeeds(): Promise<void> {
  const feeds = await db.calendarFeed.findMany({ where: { enabled: true } });
  for (const feed of feeds) {
    try {
      const { count } = await syncFeed(feed.id);
      console.log(`[calendar] synced "${feed.name}" — ${count} events`);
    } catch (err) {
      console.warn(`[calendar] sync failed for "${feed.name}":`, err);
    }
  }
}
