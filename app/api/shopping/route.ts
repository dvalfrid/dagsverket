import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";

export const GET = handler(async () => {
  const items = await db.shoppingItem.findMany({
    orderBy: [{ checked: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return ok(items);
});

const createSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.string().trim().optional(),
  category: z.string().trim().optional(),
  addedByPersonId: z.string().nullable().optional(),
});

/** Open to any paired device — family members add from any iPad. */
export const POST = handler(async (req) => {
  const data = await readJson(req, createSchema);
  const max = await db.shoppingItem.aggregate({ _max: { sortOrder: true } });
  const item = await db.shoppingItem.create({
    data: { ...data, sortOrder: (max._max.sortOrder ?? 0) + 1 },
  });
  publish("shopping");
  return ok(item, { status: 201 });
});
