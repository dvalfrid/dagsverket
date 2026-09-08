import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  url: z.string().url().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  enabled: z.boolean().optional(),
});

export const PATCH = handler(
  async (req, { params }) => {
    const { id } = await params;
    const data = await readJson(req, patchSchema);
    const feed = await db.calendarFeed.update({ where: { id }, data });
    publish("calendar");
    return ok(feed);
  },
  { admin: true },
);

export const DELETE = handler(
  async (_req, { params }) => {
    const { id } = await params;
    await db.calendarFeed.delete({ where: { id } });
    publish("calendar");
    return ok({ ok: true });
  },
  { admin: true },
);
