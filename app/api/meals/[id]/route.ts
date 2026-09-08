import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";

const patchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  slot: z.enum(["lunch", "dinner"]).optional(),
  recipeUrl: z.string().url().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  const data = await readJson(req, patchSchema);
  const meal = await db.mealPlan.update({ where: { id }, data });
  publish("meals");
  return ok(meal);
}, { admin: true });

export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  await db.mealPlan.delete({ where: { id } });
  publish("meals");
  return ok({ ok: true });
}, { admin: true });
