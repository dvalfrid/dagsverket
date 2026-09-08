"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLiveData, apiFetch } from "@/lib/useLiveData";
import { todayKey, weekStart, weekDays, addDays, isoWeek } from "@/lib/dates";
import { weekdayMessageKey } from "@/lib/format";
import { inputClass } from "@/components/ui";
import { PageTitle } from "@/components/admin/parts";

interface Meal {
  id: string;
  date: string;
  slot: string;
  title: string;
  notes: string | null;
}

export default function MealsAdmin() {
  const t = useTranslations("admin.meals");
  const tc = useTranslations("common");
  const tw = useTranslations("weekday");
  const [from, setFrom] = useState(() => weekStart(todayKey()));
  const days = weekDays(from);
  const to = days[6];

  const { data, mutate } = useLiveData<{ meals: Meal[] }>(`/api/meals?from=${from}&to=${to}`);
  const byDate = new Map((data?.meals ?? []).filter((m) => m.slot === "dinner").map((m) => [m.date, m]));

  async function save(date: string, title: string, notes: string) {
    const existing = byDate.get(date);
    if (!title.trim()) {
      if (existing) await apiFetch(`/api/meals/${existing.id}`, { method: "DELETE" });
    } else {
      await apiFetch("/api/meals", { json: { date, slot: "dinner", title, notes: notes || null } });
    }
    mutate();
  }

  return (
    <>
      <PageTitle>{t("title")}</PageTitle>

      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => setFrom(addDays(from, -7))} className="rounded-lg border border-border p-2 hover:bg-surface-hover">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium">{tc("week", { n: isoWeek(from) })}</span>
        <button onClick={() => setFrom(addDays(from, 7))} className="rounded-lg border border-border p-2 hover:bg-surface-hover">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {days.map((date) => {
          const meal = byDate.get(date);
          return (
            <DayRow
              key={`${date}:${meal?.id ?? "new"}`}
              date={date}
              label={tw(weekdayMessageKey(date))}
              meal={meal}
              onSave={save}
              titlePlaceholder={t("meal")}
            />
          );
        })}
      </div>
    </>
  );
}

function DayRow({
  date,
  label,
  meal,
  onSave,
  titlePlaceholder,
}: {
  date: string;
  label: string;
  meal?: Meal;
  onSave: (date: string, title: string, notes: string) => void;
  titlePlaceholder: string;
}) {
  const [title, setTitle] = useState(meal?.title ?? "");
  const [notes, setNotes] = useState(meal?.notes ?? "");

  return (
    <div className="card flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
      <span className="w-24 shrink-0 pt-2 text-xs uppercase tracking-wide text-text-subtle">
        {label} {date.slice(8)}
      </span>
      <div className="flex flex-1 flex-col gap-2">
        <input
          value={title}
          placeholder={titlePlaceholder}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => (title !== (meal?.title ?? "") || notes !== (meal?.notes ?? "")) && onSave(date, title, notes)}
          className={inputClass()}
        />
        <textarea
          value={notes}
          rows={notes ? 3 : 1}
          placeholder="Ingredienser, en per rad – ‘500 g · nötfärs’"
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => title.trim() && notes !== (meal?.notes ?? "") && onSave(date, title, notes)}
          className={inputClass("resize-none text-xs")}
        />
      </div>
    </div>
  );
}
