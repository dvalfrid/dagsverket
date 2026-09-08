import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";

export const GET = handler(async () => {
  const people = await db.person.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return ok(people);
});

const createSchema = z.object({
  name: z.string().trim().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  avatarEmoji: z.string().min(1).max(8).optional(),
  isChild: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const POST = handler(async (req) => {
  const data = await readJson(req, createSchema);
  const person = await db.person.create({ data });
  publish("people", "chores");
  return ok(person, { status: 201 });
}, { admin: true });
