"use client";

import type { WidgetConfig, WidgetSize } from "@/lib/widgets";
import { cn } from "./ui";
import type { DashboardProfile } from "./Dashboard";
import { ClockWidget } from "./widgets/ClockWidget";
import { CalendarWidget } from "./widgets/CalendarWidget";
import { ChoresWidget } from "./widgets/ChoresWidget";
import { ShoppingWidget } from "./widgets/ShoppingWidget";
import { MealsWidget } from "./widgets/MealsWidget";

const REGISTRY = {
  clock: ClockWidget,
  calendar: CalendarWidget,
  chores: ChoresWidget,
  shopping: ShoppingWidget,
  meals: MealsWidget,
} as const;

// Literal classes so Tailwind can see them. 6-col grid on large screens.
const COL_SPAN: Record<WidgetSize, string> = {
  sm: "sm:col-span-2 lg:col-span-2",
  md: "sm:col-span-2 lg:col-span-3",
  lg: "sm:col-span-2 lg:col-span-4",
  xl: "sm:col-span-2 lg:col-span-6",
};
const ROW_SPAN: Record<WidgetSize, string> = {
  sm: "lg:row-span-1",
  md: "lg:row-span-1",
  lg: "lg:row-span-2",
  xl: "lg:row-span-2",
};

export interface WidgetProps {
  config: WidgetConfig;
  profile: DashboardProfile;
}

export function DashboardGrid({
  widgets,
  profile,
}: {
  widgets: WidgetConfig[];
  profile: DashboardProfile;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 auto-rows-[minmax(200px,auto)] sm:grid-cols-2 lg:h-full lg:auto-rows-fr lg:grid-cols-6 lg:overflow-hidden">
      {widgets.map((config) => {
        const Widget = REGISTRY[config.type];
        if (!Widget) return null;
        return (
          <div
            key={config.id}
            className={cn("h-full min-h-0", COL_SPAN[config.size], ROW_SPAN[config.size])}
          >
            <Widget config={config} profile={profile} />
          </div>
        );
      })}
    </div>
  );
}
