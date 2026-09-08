"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { todayKey, isoWeek } from "@/lib/dates";
import type { WidgetProps } from "../DashboardGrid";

export function ClockWidget({ config }: WidgetProps) {
  const t = useTranslations("common");
  const f = useFormatter();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const showDate = config.options.showDate ?? true;
  const showWeek = config.options.showWeek ?? false;

  return (
    <div className="card flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <div
        suppressHydrationWarning
        className="text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl"
      >
        {f.dateTime(now, { hour: "2-digit", minute: "2-digit", hour12: false })}
      </div>
      {showDate ? (
        <div suppressHydrationWarning className="text-base capitalize text-text-muted">
          {f.dateTime(now, { weekday: "long", day: "numeric", month: "long" })}
        </div>
      ) : null}
      {showWeek ? (
        <div className="mt-1 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          {t("week", { n: isoWeek(todayKey()) })}
        </div>
      ) : null}
    </div>
  );
}
