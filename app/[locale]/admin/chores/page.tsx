"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLiveData, apiFetch } from "@/lib/useLiveData";
import { Button, Field, inputClass } from "@/components/ui";
import { PageTitle, ListCard, ListRow, DeleteButton } from "@/components/admin/parts";

interface Person { id: string; name: string; avatarEmoji: string }
interface Chore {
  id: string;
  title: string;
  personId: string | null;
  recurrence: "daily" | "weekdays" | "weekly" | "custom";
  weekdaysMask: number;
  active: boolean;
}

const RECURRENCES = ["daily", "weekdays", "weekly", "custom"] as const;
const DAY_BITS = [
  ["monShort", 1], ["tueShort", 2], ["wedShort", 4], ["thuShort", 8],
  ["friShort", 16], ["satShort", 32], ["sunShort", 64],
] as const;

export default function ChoresAdmin() {
  const t = useTranslations("admin.chores");
  const tw = useTranslations("weekday");
  const { data, mutate } = useLiveData<{ chores: Chore[] }>("/api/chores?all=1");
  const { data: people } = useLiveData<Person[]>("/api/people");

  const [title, setTitle] = useState("");
  const [personId, setPersonId] = useState("");
  const [recurrence, setRecurrence] = useState<(typeof RECURRENCES)[number]>("weekly");
  const [mask, setMask] = useState(0);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await apiFetch("/api/chores", {
      json: { title, personId: personId || null, recurrence, weekdaysMask: mask },
    });
    setTitle("");
    setMask(0);
    mutate();
  }
  async function patch(id: string, body: Partial<Chore>) {
    await apiFetch(`/api/chores/${id}`, { method: "PATCH", json: body });
    mutate();
  }
  const maskNeeded = recurrence === "weekly" || recurrence === "custom";

  return (
    <>
      <PageTitle>{t("title")}</PageTitle>

      <ListCard>
        {(data?.chores ?? []).map((c) => (
          <ListRow key={c.id} className="flex-wrap">
            <input
              defaultValue={c.title}
              onBlur={(e) => e.target.value !== c.title && patch(c.id, { title: e.target.value })}
              className={inputClass("min-w-40 flex-1")}
            />
            <select
              value={c.personId ?? ""}
              onChange={(e) => patch(c.id, { personId: e.target.value || null })}
              className={inputClass("w-40")}
            >
              <option value="">–</option>
              {(people ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.avatarEmoji} {p.name}</option>
              ))}
            </select>
            <select
              value={c.recurrence}
              onChange={(e) => patch(c.id, { recurrence: e.target.value as Chore["recurrence"] })}
              className={inputClass("w-40")}
            >
              {RECURRENCES.map((r) => (
                <option key={r} value={r}>
                  {t(`recurrence${r[0].toUpperCase()}${r.slice(1)}`)}
                </option>
              ))}
            </select>
            {(c.recurrence === "weekly" || c.recurrence === "custom") ? (
              <div className="flex gap-1">
                {DAY_BITS.map(([label, bit]) => (
                  <button
                    key={bit}
                    onClick={() => patch(c.id, { weekdaysMask: c.weekdaysMask ^ bit })}
                    className={`h-8 w-8 rounded-lg border text-xs ${
                      c.weekdaysMask & bit
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border text-text-subtle"
                    }`}
                  >
                    {tw(label).slice(0, 1)}
                  </button>
                ))}
              </div>
            ) : null}
            <label className="flex items-center gap-1.5 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={c.active}
                onChange={(e) => patch(c.id, { active: e.target.checked })}
              />
              {t("active")}
            </label>
            <DeleteButton onConfirm={() => apiFetch(`/api/chores/${c.id}`, { method: "DELETE" }).then(() => mutate())} />
          </ListRow>
        ))}
      </ListCard>

      <form onSubmit={add} className="card mt-4 flex flex-wrap items-end gap-3 p-4">
        <Field label={t("choreTitle")}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass("min-w-44")} />
        </Field>
        <Field label={t("person")}>
          <select value={personId} onChange={(e) => setPersonId(e.target.value)} className={inputClass("w-40")}>
            <option value="">–</option>
            {(people ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.avatarEmoji} {p.name}</option>
            ))}
          </select>
        </Field>
        <Field label={t("recurrence")}>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}
            className={inputClass("w-40")}
          >
            {RECURRENCES.map((r) => (
              <option key={r} value={r}>{t(`recurrence${r[0].toUpperCase()}${r.slice(1)}`)}</option>
            ))}
          </select>
        </Field>
        {maskNeeded ? (
          <div className="flex gap-1 pb-1">
            {DAY_BITS.map(([label, bit]) => (
              <button
                type="button"
                key={bit}
                onClick={() => setMask(mask ^ bit)}
                className={`h-9 w-9 rounded-lg border text-xs ${
                  mask & bit ? "border-accent bg-accent-soft text-accent" : "border-border text-text-subtle"
                }`}
              >
                {tw(label).slice(0, 1)}
              </button>
            ))}
          </div>
        ) : null}
        <Button type="submit" variant="primary">{t("add")}</Button>
      </form>
    </>
  );
}
