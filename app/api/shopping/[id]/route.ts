import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  quantity: z.string().trim().nullable().optional(),
  category: z.string().trim().nullable().optional(),
  checked: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  const data = await readJson(req, patchSchema);
  const item = await db.shoppingItem.update({ where: { id }, data });
  publish("shopping");
  return ok(item);
});

export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  await db.shoppingItem.delete({ where: { id } });
  publish("shopping");
  return ok({ ok: true });
});
