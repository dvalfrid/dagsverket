import { defineRouting } from "next-intl/routing";

export const locales = ["sv", "en"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "sv",
  // "sv" is served without a prefix, "en" lives under /en.
  localePrefix: "as-needed",
});
