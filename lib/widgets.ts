import { z } from "zod";

export const WIDGET_TYPES = [
  "clock",
  "calendar",
  "chores",
  "shopping",
  "meals",
] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

export const WIDGET_SIZES = ["sm", "md", "lg", "xl"] as const;
export type WidgetSize = (typeof WIDGET_SIZES)[number];

/** Column / row span per size on the 6-column dashboard grid. */
export const SIZE_SPAN: Record<WidgetSize, { col: number; row: number }> = {
  sm: { col: 2, row: 1 },
  md: { col: 3, row: 1 },
  lg: { col: 4, row: 2 },
  xl: { col: 6, row: 2 },
};

const widgetOptions = z
  .object({
    // clock
    showDate: z.boolean().optional(),
    showWeek: z.boolean().optional(),
    // calendar / meals horizon (days ahead from today)
    days: z.number().int().min(1).max(90).optional(),
    // chores: "today" | "week"  ·  calendar: "agenda" | "week"
    scope: z.enum(["person", "all"]).optional(),
    view: z.enum(["today", "week", "agenda"]).optional(),
    // calendar week view — visible hour range
    hourStart: z.number().int().min(0).max(22).optional(),
    hourEnd: z.number().int().min(1).max(24).optional(),
    // calendar — restrict to these feed ids ([] / undefined = all feeds)
    feedIds: z.array(z.string()).optional(),
  })
  .strict()
  .default({});

export const widgetSchema = z.object({
  id: z.string().min(1),
  type: z.enum(WIDGET_TYPES),
  size: z.enum(WIDGET_SIZES).default("md"),
  options: widgetOptions,
});
export type WidgetConfig = z.infer<typeof widgetSchema>;

export const widgetsSchema = z.array(widgetSchema);

/** Tolerant parse of Profile.widgetsJson — never throws. */
export function parseWidgets(json: string | null | undefined): WidgetConfig[] {
  if (!json) return [];
  try {
    const parsed = widgetsSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export const DEFAULT_WIDGETS: Record<Profile["type"], WidgetConfig[]> = {
  admin: [
    { id: "w-clock", type: "clock", size: "sm", options: { showDate: true, showWeek: true } },
    { id: "w-cal", type: "calendar", size: "lg", options: { days: 7 } },
    { id: "w-chores", type: "chores", size: "md", options: { scope: "all", view: "week" } },
    { id: "w-shop", type: "shopping", size: "md", options: {} },
    { id: "w-meals", type: "meals", size: "md", options: { days: 7 } },
  ],
  family: [
    { id: "w-clock", type: "clock", size: "sm", options: { showDate: true, showWeek: true } },
    { id: "w-cal", type: "calendar", size: "lg", options: { days: 7 } },
    { id: "w-chores", type: "chores", size: "md", options: { scope: "all", view: "today" } },
    { id: "w-shop", type: "shopping", size: "md", options: {} },
    { id: "w-meals", type: "meals", size: "md", options: { days: 7 } },
  ],
  child: [
    { id: "w-clock", type: "clock", size: "sm", options: { showDate: true, showWeek: false } },
    { id: "w-chores", type: "chores", size: "lg", options: { scope: "person", view: "today" } },
    { id: "w-cal", type: "calendar", size: "md", options: { days: 3 } },
  ],
};

type Profile = { type: "admin" | "family" | "child" };
