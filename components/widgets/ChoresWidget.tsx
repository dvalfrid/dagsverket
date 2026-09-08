"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { useLiveData, apiFetch } from "@/lib/useLiveData";
import { todayKey, weekStart, weekDays } from "@/lib/dates";
import { weekdayMessageKey } from "@/lib/format";
import { cn, WidgetFrame, EmptyState } from "../ui";
import type { WidgetProps } from "../DashboardGrid";

interface Person {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string;
}
interface Chore {
  id: string;
  title: string;
  note: string | null;
  personId: string | null;
  occurrences: string[];
  completions: Record<string, { personId: string | null; completedAt: string }>;
}
interface ChoresResponse {
  range: { from: string; to: string; today: string };
  chores: Chore[];
}

export function ChoresWidget({ config, profile }: WidgetProps) {
  const t = useTranslations("widget.chores");
  const tw = useTranslations("weekday");

  const scope = config.options.scope ?? (profile.person ? "person" : "all");
  const view = config.options.view ?? "today";
  const personId = scope === "person" ? profile.person?.id : undefined;

  const from = weekStart(todayKey());
  const url = `/api/chores?from=${from}${personId ? `&personId=${personId}` : ""}`;

  const { data, mutate } = useLiveData<ChoresResponse>(url);
  const { data: people } = useLiveData<Person[]>("/api/people");
  const peopleById = useMemo(() => new Map((people ?? []).map((p) => [p.id, p])), [people]);

  const today = data?.range.today ?? todayKey();
  const days = weekDays(from);

  async function toggle(choreId: string, date: string, done: boolean) {
    if (!data) return;
    const next: ChoresResponse = {
      ...data,
      chores: data.chores.map((c) => {
        if (c.id !== choreId) return c;
        const completions = { ...c.completions };
        if (done) delete completions[date];
        else
          completions[date] = { personId: personId ?? null, completedAt: new Date().toISOString() };
        return { ...c, completions };
      }),
    };
    mutate(next, { revalidate: false });
    try {
      await apiFetch("/api/chores/toggle", {
        json: { choreId, date, personId: personId ?? null, done: !done },
      });
    } finally {
      mutate();
    }
  }

  if (!data) {
    return (
      <WidgetFrame title={t("title")} icon={<ListChecks size={16} />}>
        <EmptyState>…</EmptyState>
      </WidgetFrame>
    );
  }

  const todays = data.chores.filter((c) => c.occurrences.includes(today));
  const doneToday = todays.filter((c) => c.completions[today]).length;

  return (
    <WidgetFrame
      title={t("title")}
      icon={<ListChecks size={16} />}
      action={
        view === "today" && todays.length > 0 ? (
          <span className="text-xs text-text-subtle">
            {t("doneCount", { done: doneToday, total: todays.length })}
          </span>
        ) : null
      }
    >
      {view === "week" ? (
        <WeekView
          chores={data.chores}
          days={days}
          today={today}
          peopleById={peopleById}
          onToggle={toggle}
          weekdayLabel={(k) => tw(`${weekdayMessageKey(k)}Short`)}
        />
      ) : todays.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {[...todays]
            .sort((a, b) => Number(!!a.completions[today]) - Number(!!b.completions[today]))
            .map((c) => {
              const done = !!c.completions[today];
              const person = c.personId ? peopleById.get(c.personId) : undefined;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => toggle(c.id, today, done)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-surface-hover",
                      done && "opacity-55",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="shrink-0 text-success" size={26} />
                    ) : (
                      <Circle className="shrink-0 text-text-subtle" size={26} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate font-medium", done && "line-through")}>
                        {c.title}
                      </span>
                      {c.note ? (
                        <span className="block truncate text-xs text-text-subtle">{c.note}</span>
                      ) : null}
                    </span>
                    {person ? (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-xs"
                        style={{ backgroundColor: `${person.color}22`, color: person.color }}
                      >
                        {person.avatarEmoji} {person.name}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </WidgetFrame>
  );
}

function WeekView({
  chores,
  days,
  today,
  peopleById,
  onToggle,
  weekdayLabel,
}: {
  chores: Chore[];
  days: string[];
  today: string;
  peopleById: Map<string, Person>;
  onToggle: (choreId: string, date: string, done: boolean) => void;
  weekdayLabel: (dayKey: string) => string;
}) {
  if (chores.length === 0) return <EmptyState>–</EmptyState>;
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[1fr_repeat(7,1.75rem)] items-center gap-1 pb-1 text-[10px] uppercase text-text-subtle">
        <span />
        {days.map((d) => (
          <span key={d} className={cn("text-center", d === today && "text-accent")}>
            {weekdayLabel(d).slice(0, 2)}
          </span>
        ))}
      </div>
      {chores.map((c) => {
        const person = c.personId ? peopleById.get(c.personId) : undefined;
        return (
          <div
            key={c.id}
            className="grid grid-cols-[1fr_repeat(7,1.75rem)] items-center gap-1 py-0.5"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm">{c.title}</span>
              {person ? <span className="text-xs">{person.avatarEmoji}</span> : null}
            </span>
            {days.map((d) => {
              const isOcc = c.occurrences.includes(d);
              const done = !!c.completions[d];
              return (
                <button
                  key={d}
                  disabled={!isOcc}
                  onClick={() => onToggle(c.id, d, done)}
                  className={cn(
                    "mx-auto h-7 w-7 rounded-lg border transition-colors",
                    !isOcc && "border-transparent",
                    isOcc && !done && "border-border hover:border-accent",
                    done && "border-success bg-success/20",
                  )}
                  aria-label={c.title}
                >
                  {done ? <CheckCircle2 className="mx-auto text-success" size={16} /> : null}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
