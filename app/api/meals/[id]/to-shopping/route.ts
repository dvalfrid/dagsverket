import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, bad } from "@/lib/http";

/**
 * Turn a meal's notes into shopping items — one per non-empty line
 * (an optional "2 st · " / "500 g - " prefix becomes the quantity).
 */
export const POST = handler(async (_req, { params }) => {
  const { id } = await params;
  const meal = await db.mealPlan.findUnique({ where: { id } });
  if (!meal) return bad("meal not found", 404);
  if (!meal.notes?.trim()) return bad("no-ingredients", 422);

  const lines = meal.notes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const max = await db.shoppingItem.aggregate({ _max: { sortOrder: true } });
  let order = (max._max.sortOrder ?? 0) + 1;

  const created = await db.$transaction(
    lines.map((line) => {
      const m = line.match(/^(.+?)\s*(?:[·\-–])\s*(.+)$/);
      const [name, quantity] = m ? [m[2], m[1]] : [line, null];
      return db.shoppingItem.create({
        data: { name, quantity, category: meal.title, sortOrder: order++ },
      });
    }),
  );

  publish("shopping");
  return ok({ added: created.length });
});
