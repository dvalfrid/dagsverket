"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import { apiFetch, useLiveData } from "@/lib/useLiveData";
import { WIDGET_TYPES, WIDGET_SIZES, type WidgetConfig, type WidgetType } from "@/lib/widgets";
import { Button, Field, inputClass, cn } from "../ui";
import { DeleteButton } from "./parts";

interface Person {
  id: string;
  name: string;
  avatarEmoji: string;
}
interface Feed {
  id: string;
  name: string;
  color: string;
}
export interface AdminProfile {
  id: string;
  name: string;
  type: "admin" | "family" | "child";
  locale: string | null;
  theme: "dark" | "light";
  personId: string | null;
  widgets: WidgetConfig[];
}

function newWidget(type: WidgetType): WidgetConfig {
  return {
    id: `w-${type}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    size: "md",
    options: {},
  };
}

export function ProfileEditor({
  profile,
  people,
  onChanged,
}: {
  profile: AdminProfile;
  people: Person[];
  onChanged: () => void;
}) {
  const t = useTranslations("admin.profiles");
  const tc = useTranslations("common");
  const tWidget = useTranslations("widget");
  const { data: feeds } = useLiveData<Feed[]>("/api/calendar/feeds/list");
  const [widgets, setWidgets] = useState<WidgetConfig[]>(profile.widgets);
  const [dirty, setDirty] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const update = (next: WidgetConfig[]) => {
    setWidgets(next);
    setDirty(true);
  };

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = widgets.findIndex((w) => w.id === active.id);
    const to = widgets.findIndex((w) => w.id === over.id);
    update(arrayMove(widgets, from, to));
  }

  async function patch(body: Partial<AdminProfile> & { widgets?: WidgetConfig[] }) {
    await apiFetch(`/api/profiles/${profile.id}`, { method: "PATCH", json: body });
    onChanged();
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("name")}>
          <input
            defaultValue={profile.name}
            onBlur={(e) => e.target.value !== profile.name && patch({ name: e.target.value })}
            className={inputClass("min-w-40")}
          />
        </Field>
        <Field label={t("type")}>
          <select
            value={profile.type}
            onChange={(e) => patch({ type: e.target.value as AdminProfile["type"] })}
            className={inputClass("w-32")}
          >
            <option value="admin">{t("typeAdmin")}</option>
            <option value="family">{t("typeFamily")}</option>
            <option value="child">{t("typeChild")}</option>
          </select>
        </Field>
        <Field label={t("locale")}>
          <select
            value={profile.locale ?? ""}
            onChange={(e) => patch({ locale: (e.target.value || null) as AdminProfile["locale"] })}
            className={inputClass("w-32")}
          >
            <option value="">{t("localeDefault")}</option>
            <option value="sv">Svenska</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label={t("theme")}>
          <select
            value={profile.theme}
            onChange={(e) => patch({ theme: e.target.value as AdminProfile["theme"] })}
            className={inputClass("w-28")}
          >
            <option value="dark">{t("themeDark")}</option>
            <option value="light">{t("themeLight")}</option>
          </select>
        </Field>
        <Field label={t("person")}>
          <select
            value={profile.personId ?? ""}
            onChange={(e) => patch({ personId: e.target.value || null })}
            className={inputClass("w-40")}
          >
            <option value="">–</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.avatarEmoji} {p.name}
              </option>
            ))}
          </select>
        </Field>
        <DeleteButton
          onConfirm={() =>
            apiFetch(`/api/profiles/${profile.id}`, { method: "DELETE" }).then(onChanged)
          }
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-text-muted">{t("widgets")}</p>
        <p className="mb-2 text-xs text-text-subtle">{t("widgetsHint")}</p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {widgets.map((w, i) => (
                <WidgetRow
                  key={w.id}
                  widget={w}
                  label={tWidget(`${w.type}.title`)}
                  feeds={feeds ?? []}
                  onChange={(next) => update(widgets.map((x, xi) => (xi === i ? next : x)))}
                  onRemove={() => update(widgets.filter((_, xi) => xi !== i))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {WIDGET_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => update([...widgets, newWidget(type)])}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-text-muted hover:border-accent hover:text-accent"
            >
              <Plus size={12} />
              {tWidget(`${type}.title`)}
            </button>
          ))}
        </div>

        {dirty ? (
          <Button
            variant="primary"
            className="mt-3"
            onClick={async () => {
              await patch({ widgets });
              setDirty(false);
            }}
          >
            {tc("save")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Control({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-wide text-text-subtle">
      {caption}
      {children}
    </label>
  );
}

function WidgetRow({
  widget,
  label,
  feeds,
  onChange,
  onRemove,
}: {
  widget: WidgetConfig;
  label: string;
  feeds: Feed[];
  onChange: (w: WidgetConfig) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("admin.profiles");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });
  const setOpt = (patch: Record<string, unknown>) =>
    onChange({ ...widget, options: { ...widget.options, ...patch } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-xl border border-border bg-surface-2 px-3 py-2.5",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-text-subtle"
          aria-label="drag"
        >
          <GripVertical size={16} />
        </button>
        <span className="flex-1 text-sm font-medium">{label}</span>
        <button
          onClick={onRemove}
          className="text-text-subtle hover:text-danger"
          aria-label="remove"
        >
          <X size={15} />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-3 pl-6">
        <Control caption={t("opt.size")}>
          <select
            value={widget.size}
            onChange={(e) => onChange({ ...widget, size: e.target.value as WidgetConfig["size"] })}
            className={inputClass("w-20 py-1")}
          >
            {WIDGET_SIZES.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </Control>

        {widget.type === "chores" ? (
          <>
            <Control caption={t("opt.scope")}>
              <select
                value={widget.options.scope ?? "all"}
                onChange={(e) => setOpt({ scope: e.target.value as "all" | "person" })}
                className={inputClass("w-44 py-1")}
              >
                <option value="all">{t("scopeAll")}</option>
                <option value="person">{t("scopePerson")}</option>
              </select>
            </Control>
            <Control caption={t("opt.view")}>
              <select
                value={widget.options.view ?? "today"}
                onChange={(e) => setOpt({ view: e.target.value as "today" | "week" })}
                className={inputClass("w-36 py-1")}
              >
                <option value="today">{t("viewToday")}</option>
                <option value="week">{t("viewWeek")}</option>
              </select>
            </Control>
          </>
        ) : null}

        {widget.type === "meals" ? (
          <Control caption={t("opt.days")}>
            <input
              type="number"
              min={1}
              max={21}
              value={widget.options.days ?? 7}
              onChange={(e) => setOpt({ days: Number(e.target.value) })}
              className={inputClass("w-20 py-1")}
            />
          </Control>
        ) : null}

        {widget.type === "calendar" ? (
          <>
            <Control caption={t("opt.view")}>
              <select
                value={widget.options.view === "week" ? "week" : "agenda"}
                onChange={(e) => setOpt({ view: e.target.value as "week" | "agenda" })}
                className={inputClass("w-40 py-1")}
              >
                <option value="agenda">{t("calViewAgenda")}</option>
                <option value="week">{t("calViewWeek")}</option>
              </select>
            </Control>

            {widget.options.view === "week" ? (
              <>
                <Control caption={t("opt.hourStart")}>
                  <input
                    type="number"
                    min={0}
                    max={22}
                    value={widget.options.hourStart ?? 8}
                    onChange={(e) => setOpt({ hourStart: Number(e.target.value) })}
                    className={inputClass("w-16 py-1")}
                  />
                </Control>
                <Control caption={t("opt.hourEnd")}>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={widget.options.hourEnd ?? 20}
                    onChange={(e) => setOpt({ hourEnd: Number(e.target.value) })}
                    className={inputClass("w-16 py-1")}
                  />
                </Control>
              </>
            ) : (
              <Control caption={t("opt.days")}>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={widget.options.days ?? 14}
                  onChange={(e) => setOpt({ days: Number(e.target.value) })}
                  className={inputClass("w-20 py-1")}
                />
              </Control>
            )}

            {feeds.length > 0 ? (
              <Control caption={t("opt.feeds")}>
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                  {feeds.map((fd) => {
                    const sel = widget.options.feedIds ?? [];
                    const on = sel.length === 0 || sel.includes(fd.id);
                    return (
                      <label
                        key={fd.id}
                        className="flex items-center gap-1.5 text-[11px] font-normal normal-case tracking-normal text-text-muted"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) => {
                            const base = sel.length === 0 ? feeds.map((x) => x.id) : sel;
                            let next = e.target.checked
                              ? [...new Set([...base, fd.id])]
                              : base.filter((x) => x !== fd.id);
                            if (next.length === feeds.length) next = [];
                            setOpt({ feedIds: next });
                          }}
                        />
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: fd.color }}
                        />
                        {fd.name}
                      </label>
                    );
                  })}
                </div>
              </Control>
            ) : null}
          </>
        ) : null}

        {widget.type === "clock" ? (
          <>
            <label className="flex items-center gap-1.5 pb-1.5 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={widget.options.showDate ?? true}
                onChange={(e) => setOpt({ showDate: e.target.checked })}
              />
              {t("opt.showDate")}
            </label>
            <label className="flex items-center gap-1.5 pb-1.5 text-xs text-text-muted">
              <input
                type="checkbox"
                checked={widget.options.showWeek ?? false}
                onChange={(e) => setOpt({ showWeek: e.target.checked })}
              />
              {t("opt.showWeek")}
            </label>
          </>
        ) : null}
      </div>

      <p className="mt-2 pl-6 text-xs text-text-subtle">{t(`help.${widget.type}`)}</p>
    </div>
  );
}
