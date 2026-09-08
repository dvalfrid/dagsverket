import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";

const schema = z.object({
  choreId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  personId: z.string().nullable().optional(),
  // Optional explicit target state; when omitted we flip the current one.
  done: z.boolean().optional(),
});

/** Tick / untick a chore for a given day. Open to any paired device. */
export const POST = handler(async (req) => {
  const { choreId, date, personId, done } = await readJson(req, schema);

  const existing = await db.choreCompletion.findUnique({
    where: { choreId_date: { choreId, date } },
  });
  const shouldBeDone = done ?? !existing;

  if (shouldBeDone && !existing) {
    await db.choreCompletion.create({ data: { choreId, date, personId: personId ?? null } });
  } else if (!shouldBeDone && existing) {
    await db.choreCompletion.delete({ where: { id: existing.id } });
  }

  publish("chores");
  return ok({ choreId, date, done: shouldBeDone });
});
