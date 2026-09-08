"use client";

import { useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useLiveData } from "@/lib/useLiveData";
import { todayKey, weekStart, weekDays } from "@/lib/dates";
import { weekdayMessageKey, hexToRgba } from "@/lib/format";
import { cn } from "../ui";
import { localDayKey } from "./util";
import { EventDetail, type CalEvent } from "./EventDetail";
import { useCalendarFeeds, FeedChips } from "./feeds";
import { layoutDay, type Placed } from "@/lib/calendarLayout";

const HOUR_PX = 46;
const GUTTER = "3rem";

const minutesLocal = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function CalendarWeek({
  widgetId,
  feedIds,
  hourStart = 8,
  hourEnd = 20,
}: {
  widgetId: string;
  feedIds?: string[];
  hourStart?: number;
  hourEnd?: number;
}) {
  const t = useTranslations("widget.calendar");
  const tw = useTranslations("weekday");
  const f = useFormatter();
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const { available, hidden, toggle, isVisible } = useCalendarFeeds(widgetId, feedIds);

  const from = weekStart(todayKey());
  const days = weekDays(from);
  const to = days[6];

  const { data } = useLiveData<{ events: CalEvent[]; range: { today: string } }>(
    `/api/calendar/events?from=${from}&to=${to}`,
  );

  const today = data?.range.today ?? todayKey();
  const winStart = hourStart * 60;
  const winEnd = hourEnd * 60;
  const gridHeight = (hourEnd - hourStart) * HOUR_PX;
  const hours = Array.from({ length: hourEnd - hourStart + 1 }, (_, i) => hourStart + i);
  const cols = `${GUTTER} repeat(7, minmax(0, 1fr))`;

  const { timedByDay, chipsByDay } = useMemo(() => {
    const events = (data?.events ?? []).filter((e) => isVisible(e.feedId));
    const timedByDay: Placed<CalEvent>[][] = [];
    const chipsByDay: CalEvent[][] = [];

    for (const dayKey of days) {
      const chips: CalEvent[] = [];
      const timed: CalEvent[] = [];
      for (const e of events) {
        if (e.allDay) {
          if (localDayKey(e.start) <= dayKey && dayKey < localDayKey(e.end)) chips.push(e);
          continue;
        }
        if (localDayKey(e.start) !== dayKey) continue;
        if (minutesLocal(e.start) >= winEnd || minutesLocal(e.end) <= winStart) chips.push(e);
        else timed.push(e);
      }
      timedByDay.push(layoutDay(timed));
      chipsByDay.push(chips);
    }
    return { timedByDay, chipsByDay };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, days, winStart, winEnd, hidden, feedIds]);

  const hasChips = chipsByDay.some((c) => c.length > 0);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const showNow = days.includes(today) && nowMin >= winStart && nowMin <= winEnd;

  const hm = (iso: string) =>
    f.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="flex h-full flex-col text-xs">
      <div className="shrink-0">
        <FeedChips feeds={available} hidden={hidden} onToggle={toggle} />
      </div>

      {/* Day headers */}
      <div className="grid shrink-0" style={{ gridTemplateColumns: cols }}>
        <div />
        {days.map((d) => (
          <div
            key={d}
            className={cn(
              "pb-1.5 text-center",
              d === today ? "font-semibold text-accent" : "text-text-muted",
            )}
          >
            <div className="uppercase tracking-wide">{tw(`${weekdayMessageKey(d)}Short`)}</div>
            <div className="text-text-subtle">{Number(d.slice(8))}</div>
          </div>
        ))}
      </div>

      {/* All-day + out-of-range chips */}
      {hasChips ? (
        <div
          className="grid shrink-0 border-y border-border py-1"
          style={{ gridTemplateColumns: cols }}
        >
          <div className="self-center pr-1.5 text-right text-[10px] text-text-subtle">
            {t("allDay")}
          </div>
          {chipsByDay.map((chips, i) => (
            <div key={days[i]} className="flex flex-col gap-0.5 px-0.5">
              {chips.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelected(ev)}
                  className="truncate rounded px-1 py-0.5 text-left text-[10px] leading-tight"
                  style={{ backgroundColor: hexToRgba(ev.color, 0.2), color: ev.color }}
                  title={`${ev.title}${ev.location ? ` · ${ev.location}` : ""}`}
                >
                  {ev.allDay ? "" : `${hm(ev.start)} `}
                  {ev.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {/* Scrollable time grid */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: cols, height: gridHeight }}>
          {/* Hour labels */}
          <div className="relative">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-text-subtle"
                style={{ top: (h - hourStart) * HOUR_PX }}
              >
                {String(h).padStart(2, "0")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d, i) => (
            <div
              key={d}
              className={cn("relative border-l border-border", d === today && "bg-accent-soft/40")}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-t border-border/50"
                  style={{ top: (h - hourStart) * HOUR_PX }}
                />
              ))}

              {d === today && showNow ? (
                <div
                  className="absolute inset-x-0 z-20 border-t-2 border-accent"
                  style={{ top: ((nowMin - winStart) / 60) * HOUR_PX }}
                />
              ) : null}

              {timedByDay[i].map(({ e, lane, lanes }) => {
                const s = clamp(minutesLocal(e.start), winStart, winEnd);
                const en = clamp(minutesLocal(e.end), winStart, winEnd);
                const top = ((s - winStart) / 60) * HOUR_PX;
                const height = Math.max(((en - s) / 60) * HOUR_PX, 15);
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className="absolute z-10 flex flex-col overflow-hidden rounded-md px-1 py-0.5 text-left leading-tight"
                    style={{
                      top,
                      height,
                      left: `${(lane * 100) / lanes}%`,
                      width: `calc(${100 / lanes}% - 2px)`,
                      backgroundColor: hexToRgba(e.color, 0.22),
                      borderLeft: `2px solid ${e.color}`,
                    }}
                    title={`${e.title}${e.location ? ` · ${e.location}` : ""}${e.notes ? `\n${e.notes}` : ""}`}
                  >
                    <span className="truncate text-[10px] font-medium" style={{ color: e.color }}>
                      {e.title}
                    </span>
                    {height > 28 ? (
                      <span className="truncate text-[10px] text-text-subtle">
                        {hm(e.start)}–{hm(e.end)}
                      </span>
                    ) : null}
                    {height > 46 && e.location ? (
                      <span className="truncate text-[10px] text-text-subtle">{e.location}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selected ? <EventDetail event={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
