import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  avatarEmoji: z.string().min(1).max(8).optional(),
  isChild: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  const data = await readJson(req, patchSchema);
  const person = await db.person.update({ where: { id }, data });
  publish("people", "chores");
  return ok(person);
}, { admin: true });

export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  await db.person.delete({ where: { id } });
  publish("people", "chores", "profiles");
  return ok({ ok: true });
}, { admin: true });
