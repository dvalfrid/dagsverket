import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok } from "@/lib/http";

export const POST = handler(async () => {
  const { count } = await db.shoppingItem.deleteMany({ where: { checked: true } });
  publish("shopping");
  return ok({ removed: count });
});
