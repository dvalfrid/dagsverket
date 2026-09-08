"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLiveData, apiFetch } from "@/lib/useLiveData";
import { Button, Field, inputClass } from "@/components/ui";
import { PageTitle, ListCard, ListRow, DeleteButton } from "@/components/admin/parts";

interface Person {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string;
  isChild: boolean;
}

export default function PeopleAdmin() {
  const t = useTranslations("admin.people");
  const { data, mutate } = useLiveData<Person[]>("/api/people");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🙂");
  const [color, setColor] = useState("#6c8cff");
  const [isChild, setIsChild] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await apiFetch("/api/people", { json: { name, avatarEmoji: emoji, color, isChild } });
    setName("");
    setIsChild(false);
    mutate();
  }

  async function patch(id: string, body: Partial<Person>) {
    await apiFetch(`/api/people/${id}`, { method: "PATCH", json: body });
    mutate();
  }
  async function remove(id: string) {
    await apiFetch(`/api/people/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <>
      <PageTitle>{t("title")}</PageTitle>

      <ListCard>
        {(data ?? []).map((p) => (
          <ListRow key={p.id}>
            <input
              type="color"
              value={p.color}
              onChange={(e) => patch(p.id, { color: e.target.value })}
              className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
            />
            <input
              value={p.avatarEmoji}
              onChange={(e) => patch(p.id, { avatarEmoji: e.target.value })}
              className={inputClass("w-14 text-center")}
            />
            <input
              defaultValue={p.name}
              onBlur={(e) => e.target.value !== p.name && patch(p.id, { name: e.target.value })}
              className={inputClass("flex-1")}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={p.isChild}
                onChange={(e) => patch(p.id, { isChild: e.target.checked })}
              />
              {t("isChild")}
            </label>
            <DeleteButton onConfirm={() => remove(p.id)} />
          </ListRow>
        ))}
      </ListCard>

      <form onSubmit={add} className="card mt-4 flex flex-wrap items-end gap-3 p-4">
        <Field label={t("emoji")}>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className={inputClass("w-16 text-center")}
          />
        </Field>
        <Field label={t("color")}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-16 rounded-lg border border-border bg-transparent"
          />
        </Field>
        <Field label={t("name")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass("min-w-40")}
          />
        </Field>
        <label className="flex items-center gap-1.5 pb-2 text-sm text-text-muted">
          <input type="checkbox" checked={isChild} onChange={(e) => setIsChild(e.target.checked)} />
          {t("isChild")}
        </label>
        <Button type="submit" variant="primary">
          {t("add")}
        </Button>
      </form>
    </>
  );
}
