"use client";

import { useTranslations } from "next-intl";
import { UtensilsCrossed, ListPlus } from "lucide-react";
import { useLiveData, apiFetch } from "@/lib/useLiveData";
import { todayKey, addDays } from "@/lib/dates";
import { dayRelation, weekdayMessageKey } from "@/lib/format";
import { cn, WidgetFrame, EmptyState } from "../ui";
import type { WidgetProps } from "../DashboardGrid";

interface Meal {
  id: string;
  date: string;
  slot: string;
  title: string;
  notes: string | null;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function MealsWidget({ config }: WidgetProps) {
  const t = useTranslations("widget.meals");
  const tc = useTranslations("common");
  const tw = useTranslations("weekday");

  // Number of days listed, starting today.
  const days = clamp(config.options.days ?? 7, 1, 21);
  const from = todayKey();
  const to = addDays(from, days - 1);

  const { data } = useLiveData<{ meals: Meal[]; range: { today: string } }>(
    `/api/meals?from=${from}&to=${to}`,
  );

  const today = data?.range.today ?? from;
  const dinnerByDay = new Map(
    (data?.meals ?? []).filter((m) => m.slot === "dinner").map((m) => [m.date, m]),
  );
  const list = Array.from({ length: days }, (_, i) => addDays(from, i));

  async function toShopping(id: string) {
    await apiFetch(`/api/meals/${id}/to-shopping`, { method: "POST" }).catch(() => {});
  }

  return (
    <WidgetFrame title={t("title")} icon={<UtensilsCrossed size={16} />}>
      {list.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <ul className="flex flex-col">
          {list.map((day) => {
            const meal = dinnerByDay.get(day);
            const rel = dayRelation(day, today);
            const label =
              rel === "today"
                ? tc("today")
                : rel === "tomorrow"
                  ? tc("tomorrow")
                  : tw(weekdayMessageKey(day));
            return (
              <li
                key={day}
                className={cn(
                  "flex items-center gap-3 border-b border-border py-2.5 last:border-0",
                  rel === "today" && "font-medium",
                )}
              >
                <span className="w-24 shrink-0 text-xs uppercase tracking-wide text-text-subtle">
                  {label}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {meal ? meal.title : <span className="text-text-subtle">–</span>}
                </span>
                {meal?.notes ? (
                  <button
                    onClick={() => toShopping(meal.id)}
                    className="shrink-0 text-text-subtle hover:text-accent"
                    title={t("toShopping")}
                  >
                    <ListPlus size={16} />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </WidgetFrame>
  );
}
