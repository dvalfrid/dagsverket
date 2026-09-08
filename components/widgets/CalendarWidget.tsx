"use client";

import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import { useLiveData } from "@/lib/useLiveData";
import { todayKey, addDays } from "@/lib/dates";
import { dayRelation } from "@/lib/format";
import { WidgetFrame, EmptyState } from "../ui";
import type { WidgetProps } from "../DashboardGrid";
import { groupByDay, localDayKey } from "./util";
import { CalendarWeek } from "./CalendarWeek";
import { EventDetail, type CalEvent } from "./EventDetail";
import { useCalendarFeeds, FeedChips } from "./feeds";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function CalendarWidget({ config }: WidgetProps) {
  const t = useTranslations("widget.calendar");

  if (config.options.view === "week") {
    return (
      <WidgetFrame title={t("title")} icon={<CalendarDays size={16} />}>
        <CalendarWeek
          widgetId={config.id}
          feedIds={config.options.feedIds}
          hourStart={config.options.hourStart ?? 8}
          hourEnd={config.options.hourEnd ?? 20}
        />
      </WidgetFrame>
    );
  }

  return <CalendarAgenda config={config} />;
}

function CalendarAgenda({ config }: Pick<WidgetProps, "config">) {
  const t = useTranslations("widget.calendar");
  const tc = useTranslations("common");
  const f = useFormatter();
  const [selected, setSelected] = useState<CalEvent | null>(null);

  // How far ahead the widget looks. If nothing falls in that span we still show
  // the next few events so the widget is never silently empty.
  const days = clamp(config.options.days ?? 14, 1, 90);
  const maxEvents = config.size === "sm" ? 5 : config.size === "md" ? 8 : 16;

  const from = todayKey();
  // Fetch beyond `days` so the "coming up later" fallback has data to show.
  const to = addDays(from, Math.max(days, 120));

  const { available, hidden, toggle, isVisible } = useCalendarFeeds(
    config.id,
    config.options.feedIds,
  );

  const { data } = useLiveData<{ events: CalEvent[]; range: { today: string } }>(
    `/api/calendar/events?from=${from}&to=${to}`,
  );

  const today = data?.range.today ?? from;

  const { groups, outsideWindow } = useMemo(() => {
    const sorted = (data?.events ?? [])
      .filter((e) => isVisible(e.feedId))
      .sort((a, b) => a.start.localeCompare(b.start));
    const windowEnd = addDays(today, days);
    const inWindow = sorted.filter((e) => localDayKey(e.start) <= windowEnd);

    const shown = (inWindow.length > 0 ? inWindow : sorted).slice(0, maxEvents);
    const grouped = [...groupByDay(shown).entries()].sort(([a], [b]) => a.localeCompare(b));
    return { groups: grouped, outsideWindow: inWindow.length === 0 && shown.length > 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, today, days, maxEvents, hidden, config.options.feedIds]);

  return (
    <WidgetFrame title={t("title")} icon={<CalendarDays size={16} />}>
      <FeedChips feeds={available} hidden={hidden} onToggle={toggle} />
      {groups.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <>
          {outsideWindow ? (
            <p className="mb-3 text-xs text-text-subtle">{t("noneInWindow", { days })}</p>
          ) : null}
          <ul className="flex flex-col gap-4">
            {groups.map(([dayKey, events]) => {
              const rel = dayRelation(dayKey, today);
              const label =
                rel === "today"
                  ? tc("today")
                  : rel === "tomorrow"
                    ? tc("tomorrow")
                    : f.dateTime(new Date(`${dayKey}T12:00:00`), {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      });
              return (
                <li key={dayKey}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    {label}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {events
                      .sort((a, b) => a.start.localeCompare(b.start))
                      .map((ev) => (
                        <li key={ev.id}>
                          <button
                            onClick={() => setSelected(ev)}
                            className="flex w-full items-start gap-2.5 rounded-lg px-1 py-1 text-left transition-colors hover:bg-surface-hover"
                          >
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: ev.color }}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{ev.title}</p>
                              <p className="truncate text-xs text-text-subtle">
                                {ev.allDay
                                  ? t("allDay")
                                  : `${f.dateTime(new Date(ev.start), { hour: "2-digit", minute: "2-digit", hour12: false })}–${f.dateTime(new Date(ev.end), { hour: "2-digit", minute: "2-digit", hour12: false })}`}
                                {ev.location ? ` · ${ev.location}` : ""}
                              </p>
                              {ev.notes ? (
                                <p className="truncate text-xs text-text-subtle/80">{ev.notes}</p>
                              ) : null}
                            </div>
                          </button>
                        </li>
                      ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {selected ? (
        <EventDetail event={selected} onClose={() => setSelected(null)} />
      ) : null}
    </WidgetFrame>
  );
}
