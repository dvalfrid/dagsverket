import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";

const patchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  note: z.string().trim().nullable().optional(),
  personId: z.string().nullable().optional(),
  recurrence: z.enum(["daily", "weekdays", "weekly", "custom"]).optional(),
  weekdaysMask: z.number().int().min(0).max(127).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const PATCH = handler(
  async (req, { params }) => {
    const { id } = await params;
    const data = await readJson(req, patchSchema);
    const chore = await db.chore.update({ where: { id }, data });
    publish("chores");
    return ok(chore);
  },
  { admin: true },
);

export const DELETE = handler(
  async (_req, { params }) => {
    const { id } = await params;
    await db.chore.delete({ where: { id } });
    publish("chores");
    return ok({ ok: true });
  },
  { admin: true },
);
