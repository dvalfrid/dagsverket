import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";

export const GET = handler(async () => {
  const feeds = await db.calendarFeed.findMany({ orderBy: { createdAt: "asc" } });
  return ok(feeds);
}, { admin: true });

const createSchema = z.object({
  name: z.string().trim().min(1),
  url: z.string().url(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  enabled: z.boolean().optional(),
});

export const POST = handler(async (req) => {
  const data = await readJson(req, createSchema);
  const feed = await db.calendarFeed.create({ data });
  publish("calendar");
  return ok(feed, { status: 201 });
}, { admin: true });
