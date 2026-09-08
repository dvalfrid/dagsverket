import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";
import { todayKey, weekStart, weekDays } from "@/lib/dates";
import { occurrencesInRange } from "@/lib/recurrence";

/** Chores + their occurrences/completions for a date range (default: this ISO week). */
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const today = todayKey();
  const from = url.searchParams.get("from") ?? weekStart(today);
  const week = weekDays(from);
  const to = url.searchParams.get("to") ?? week[week.length - 1];
  const personId = url.searchParams.get("personId") ?? undefined;
  const includeInactive = url.searchParams.get("all") === "1";

  const chores = await db.chore.findMany({
    where: { ...(includeInactive ? {} : { active: true }), ...(personId ? { personId } : {}) },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const completions = await db.choreCompletion.findMany({
    where: { date: { gte: from, lte: to }, choreId: { in: chores.map((c) => c.id) } },
  });

  const byChore = new Map<string, Record<string, { personId: string | null; completedAt: string }>>();
  for (const c of completions) {
    const map = byChore.get(c.choreId) ?? {};
    map[c.date] = { personId: c.personId, completedAt: c.completedAt.toISOString() };
    byChore.set(c.choreId, map);
  }

  return ok({
    range: { from, to, today },
    chores: chores.map((c) => ({
      id: c.id,
      title: c.title,
      note: c.note,
      personId: c.personId,
      recurrence: c.recurrence,
      weekdaysMask: c.weekdaysMask,
      occurrences: occurrencesInRange(c, from, to),
      completions: byChore.get(c.id) ?? {},
    })),
  });
});

const createSchema = z.object({
  title: z.string().trim().min(1),
  note: z.string().trim().optional(),
  personId: z.string().nullable().optional(),
  recurrence: z.enum(["daily", "weekdays", "weekly", "custom"]).default("weekly"),
  weekdaysMask: z.number().int().min(0).max(127).default(0),
  active: z.boolean().default(true),
  sortOrder: z.number().int().optional(),
});

export const POST = handler(async (req) => {
  const data = await readJson(req, createSchema);
  const chore = await db.chore.create({ data });
  publish("chores");
  return ok(chore, { status: 201 });
}, { admin: true });
