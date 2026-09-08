import { z } from "zod";
import { verifyPin, startAdminSession, endAdminSession, isAdmin } from "@/lib/auth";
import { handler, ok, bad, readJson } from "@/lib/http";

export const GET = handler(async () => ok({ admin: await isAdmin() }));

export const POST = handler(async (req) => {
  const { pin } = await readJson(req, z.object({ pin: z.string().min(1) }));
  if (!(await verifyPin(pin))) return bad("wrong-pin", 401);
  await startAdminSession();
  return ok({ admin: true });
});

export const DELETE = handler(async () => {
  await endAdminSession();
  return ok({ admin: false });
});
