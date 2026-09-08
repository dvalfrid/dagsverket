import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";
import { todayKey, addDays } from "@/lib/dates";

export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const today = todayKey();
  const from = url.searchParams.get("from") ?? today;
  const to = url.searchParams.get("to") ?? addDays(today, 13);

  const meals = await db.mealPlan.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: [{ date: "asc" }, { slot: "asc" }],
  });
  return ok({ range: { from, to, today }, meals });
});

const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(["lunch", "dinner"]).default("dinner"),
  title: z.string().trim().min(1),
  recipeUrl: z.string().url().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

/** Upsert a meal for a (date, slot). */
export const POST = handler(async (req) => {
  const data = await readJson(req, upsertSchema);
  const meal = await db.mealPlan.upsert({
    where: { date_slot: { date: data.date, slot: data.slot } },
    update: { title: data.title, recipeUrl: data.recipeUrl ?? null, notes: data.notes ?? null },
    create: data,
  });
  publish("meals");
  return ok(meal, { status: 201 });
}, { admin: true });
