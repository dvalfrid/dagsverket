"use client";

import { useMemo, useState } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { hexToRgba } from "@/lib/format";
import { cn } from "../ui";

export interface Feed {
  id: string;
  name: string;
  color: string;
}

/**
 * Which calendar feeds a calendar widget shows.
 *   - `allowIds` (from the profile) limits what's even available.
 *   - On top of that, each device remembers its own hidden set in localStorage,
 *     so e.g. a kid can toggle "family calendar" on/off on their own iPad.
 */
export function useCalendarFeeds(widgetId: string, allowIds?: string[]) {
  const { data } = useLiveData<Feed[]>("/api/calendar/feeds/list");
  const storageKey = `dv:calfeeds:${widgetId}`;
  const [hidden, setHidden] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const allow = allowIds && allowIds.length ? new Set(allowIds) : null;

  const available = useMemo(
    () => (data ?? []).filter((f) => !allow || allow.has(f.id)),
    [data, allowIds], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toggle = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });

  const isVisible = (feedId: string | null) =>
    feedId != null && (!allow || allow.has(feedId)) && !hidden.has(feedId);

  return { available, hidden, toggle, isVisible };
}

export function FeedChips({
  feeds,
  hidden,
  onToggle,
}: {
  feeds: Feed[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (feeds.length < 2) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {feeds.map((f) => {
        const off = hidden.has(f.id);
        return (
          <button
            key={f.id}
            onClick={() => onToggle(f.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
              off ? "border-border text-text-subtle" : "border-transparent",
            )}
            style={off ? undefined : { backgroundColor: hexToRgba(f.color, 0.16), color: f.color }}
            aria-pressed={!off}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: off ? "currentColor" : f.color, opacity: off ? 0.5 : 1 }}
            />
            {f.name}
          </button>
        );
      })}
    </div>
  );
}
