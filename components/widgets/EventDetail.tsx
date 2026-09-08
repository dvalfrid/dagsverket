"use client";

import { useEffect } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { MapPin, AlignLeft, Rss, X } from "lucide-react";

export interface CalEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  notes: string | null;
  color: string;
  feedId: string | null;
  feedName: string | null;
}

/** Modal with every attribute we have for a calendar event. */
export function EventDetail({
  event,
  onClose,
}: {
  event: CalEvent;
  onClose: () => void;
}) {
  const t = useTranslations("widget.calendar");
  const f = useFormatter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hm = (iso: string) =>
    f.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit", hour12: false });
  const sameDay = event.start.slice(0, 10) === event.end.slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm space-y-3 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold" style={{ color: event.color }}>
            {event.title}
          </h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-text-subtle hover:bg-surface-hover hover:text-text"
            aria-label="close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-text-muted">
          <span className="capitalize">
            {f.dateTime(new Date(event.start), { weekday: "long", day: "numeric", month: "long" })}
          </span>
          {!event.allDay ? (
            <>
              {" · "}
              {hm(event.start)}–{hm(event.end)}
              {!sameDay
                ? ` (${f.dateTime(new Date(event.end), { day: "numeric", month: "short" })})`
                : ""}
            </>
          ) : (
            <> · {t("allDay")}</>
          )}
        </p>

        {event.location ? (
          <p className="flex items-start gap-2 text-sm">
            <MapPin size={15} className="mt-0.5 shrink-0 text-text-subtle" />
            {event.location}
          </p>
        ) : null}

        {event.notes ? (
          <p className="flex items-start gap-2 whitespace-pre-wrap text-sm text-text-muted">
            <AlignLeft size={15} className="mt-0.5 shrink-0 text-text-subtle" />
            {event.notes}
          </p>
        ) : null}

        {event.feedName ? (
          <p className="flex items-center gap-2 text-xs text-text-subtle">
            <Rss size={13} className="shrink-0" />
            {event.feedName}
          </p>
        ) : null}
      </div>
    </div>
  );
}
