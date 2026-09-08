import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";
import { widgetsSchema } from "@/lib/widgets";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  type: z.enum(["admin", "family", "child"]).optional(),
  locale: z.enum(["sv", "en"]).nullable().optional(),
  theme: z.enum(["dark", "light"]).optional(),
  personId: z.string().nullable().optional(),
  widgets: widgetsSchema.optional(),
});

export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  const { widgets, ...rest } = await readJson(req, patchSchema);
  const profile = await db.profile.update({
    where: { id },
    data: {
      ...rest,
      ...(widgets ? { widgetsJson: JSON.stringify(widgets) } : {}),
    },
  });
  publish("profiles");
  return ok(profile);
}, { admin: true });

export const DELETE = handler(async (_req, { params }) => {
  const { id } = await params;
  await db.profile.delete({ where: { id } });
  publish("profiles", "devices");
  return ok({ ok: true });
}, { admin: true });
