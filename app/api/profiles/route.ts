import { z } from "zod";
import { db } from "@/lib/db";
import { publish } from "@/lib/bus";
import { handler, ok, readJson } from "@/lib/http";
import { widgetsSchema, DEFAULT_WIDGETS, parseWidgets } from "@/lib/widgets";

export const GET = handler(async () => {
  const profiles = await db.profile.findMany({
    orderBy: { createdAt: "asc" },
    include: { person: true, _count: { select: { devices: true } } },
  });
  return ok(
    profiles.map((p) => ({ ...p, widgets: parseWidgets(p.widgetsJson) })),
  );
}, { admin: true });

const createSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["admin", "family", "child"]).default("family"),
  locale: z.enum(["sv", "en"]).nullable().optional(),
  theme: z.enum(["dark", "light"]).default("dark"),
  personId: z.string().nullable().optional(),
  widgets: widgetsSchema.optional(),
});

export const POST = handler(async (req) => {
  const { widgets, ...rest } = await readJson(req, createSchema);
  const profile = await db.profile.create({
    data: {
      ...rest,
      widgetsJson: JSON.stringify(widgets ?? DEFAULT_WIDGETS[rest.type]),
    },
  });
  publish("profiles");
  return ok(profile, { status: 201 });
}, { admin: true });
