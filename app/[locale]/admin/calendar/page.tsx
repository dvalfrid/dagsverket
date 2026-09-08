"use client";

import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { RefreshCw } from "lucide-react";
import { useLiveData, apiFetch, ApiError } from "@/lib/useLiveData";
import { Button, Field, inputClass } from "@/components/ui";
import { PageTitle, DeleteButton } from "@/components/admin/parts";

interface Feed {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export default function CalendarAdmin() {
  const t = useTranslations("admin.calendar");
  const f = useFormatter();
  const { data, mutate } = useLiveData<Feed[]>("/api/calendar/feeds");

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState("#6c8cff");
  const [syncing, setSyncing] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    await apiFetch("/api/calendar/feeds", { json: { name, url, color, enabled: true } });
    setName("");
    setUrl("");
    mutate();
  }
  async function patch(id: string, body: Partial<Feed>) {
    await apiFetch(`/api/calendar/feeds/${id}`, { method: "PATCH", json: body });
    mutate();
  }
  async function sync(id: string) {
    setSyncing(id);
    try {
      await apiFetch(`/api/calendar/feeds/${id}/sync`, { method: "POST" });
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    } finally {
      setSyncing(null);
      mutate();
    }
  }

  return (
    <>
      <PageTitle sub={t("protonHint")}>{t("title")}</PageTitle>

      <div className="space-y-3">
        {(data ?? []).map((feed) => (
          <div key={feed.id} className="card p-4">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={feed.color}
                onChange={(e) => patch(feed.id, { color: e.target.value })}
                className="h-8 w-8 shrink-0 rounded-lg border border-border bg-transparent"
              />
              <input
                defaultValue={feed.name}
                onBlur={(e) =>
                  e.target.value !== feed.name && patch(feed.id, { name: e.target.value })
                }
                className={inputClass("flex-1")}
              />
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">
                <input
                  type="checkbox"
                  checked={feed.enabled}
                  onChange={(e) => patch(feed.id, { enabled: e.target.checked })}
                />
                {t("enabled")}
              </label>
              <Button onClick={() => sync(feed.id)} disabled={syncing === feed.id}>
                <RefreshCw size={14} className={syncing === feed.id ? "animate-spin" : ""} />
                {t("syncNow")}
              </Button>
              <DeleteButton
                onConfirm={() =>
                  apiFetch(`/api/calendar/feeds/${feed.id}`, { method: "DELETE" }).then(() =>
                    mutate(),
                  )
                }
              />
            </div>
            <input
              defaultValue={feed.url}
              onBlur={(e) => e.target.value !== feed.url && patch(feed.id, { url: e.target.value })}
              className={inputClass("mt-2 font-mono text-xs")}
            />
            <p className="mt-2 text-xs text-text-subtle">
              {feed.lastError ? (
                <span className="text-danger">{feed.lastError}</span>
              ) : feed.lastSyncedAt ? (
                `${t("lastSynced")}: ${f.relativeTime(new Date(feed.lastSyncedAt))}`
              ) : (
                "–"
              )}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="card mt-4 flex flex-wrap items-end gap-3 p-4">
        <Field label={t("feedName")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass("min-w-40")}
          />
        </Field>
        <Field label={t("url")}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass("min-w-72 font-mono text-xs")}
            placeholder="https://…/calendar.ics"
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
        <Button type="submit" variant="primary">
          {t("add")}
        </Button>
      </form>
    </>
  );
}
