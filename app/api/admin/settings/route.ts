import { z } from "zod";
import { db } from "@/lib/db";
import { setPin } from "@/lib/auth";
import { handler, ok, readJson } from "@/lib/http";

async function getSetting(key: string, fallback: string) {
  return (await db.setting.findUnique({ where: { key } }))?.value ?? fallback;
}

export const GET = handler(
  async () => {
    return ok({
      timezone: await getSetting("timezone", process.env.TZ || "Europe/Stockholm"),
      defaultLocale: await getSetting("default_locale", "sv"),
    });
  },
  { admin: true },
);

const patchSchema = z.object({
  timezone: z.string().trim().min(1).optional(),
  defaultLocale: z.enum(["sv", "en"]).optional(),
  newPin: z
    .string()
    .regex(/^\d{4,10}$/)
    .optional(),
});

export const PATCH = handler(
  async (req) => {
    const { timezone, defaultLocale, newPin } = await readJson(req, patchSchema);
    if (timezone) {
      await db.setting.upsert({
        where: { key: "timezone" },
        update: { value: timezone },
        create: { key: "timezone", value: timezone },
      });
    }
    if (defaultLocale) {
      await db.setting.upsert({
        where: { key: "default_locale" },
        update: { value: defaultLocale },
        create: { key: "default_locale", value: defaultLocale },
      });
    }
    if (newPin) await setPin(newPin);
    return ok({ ok: true });
  },
  { admin: true },
);
