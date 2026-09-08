"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShoppingCart, Plus, X } from "lucide-react";
import { useLiveData, apiFetch } from "@/lib/useLiveData";
import { cn, WidgetFrame, EmptyState, Button, inputClass } from "../ui";
import type { WidgetProps } from "../DashboardGrid";

interface Item {
  id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  checked: boolean;
}

export function ShoppingWidget({ profile }: WidgetProps) {
  const t = useTranslations("widget.shopping");
  const { data, mutate } = useLiveData<Item[]>("/api/shopping");
  const [name, setName] = useState("");

  const items = data ?? [];
  const checked = items.filter((i) => i.checked);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setName("");
    const optimistic: Item = {
      id: `tmp-${Date.now()}`,
      name: value,
      quantity: null,
      category: null,
      checked: false,
    };
    mutate([...items, optimistic], { revalidate: false });
    try {
      await apiFetch("/api/shopping", {
        json: { name: value, addedByPersonId: profile.person?.id ?? null },
      });
    } finally {
      mutate();
    }
  }

  async function toggle(item: Item) {
    mutate(
      items.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)),
      { revalidate: false },
    );
    try {
      await apiFetch(`/api/shopping/${item.id}`, {
        method: "PATCH",
        json: { checked: !item.checked },
      });
    } finally {
      mutate();
    }
  }

  async function remove(item: Item) {
    mutate(
      items.filter((i) => i.id !== item.id),
      { revalidate: false },
    );
    try {
      await apiFetch(`/api/shopping/${item.id}`, { method: "DELETE" });
    } finally {
      mutate();
    }
  }

  async function clearChecked() {
    mutate(
      items.filter((i) => !i.checked),
      { revalidate: false },
    );
    try {
      await apiFetch("/api/shopping/clear-checked", { method: "POST" });
    } finally {
      mutate();
    }
  }

  return (
    <WidgetFrame
      title={t("title")}
      icon={<ShoppingCart size={16} />}
      action={
        checked.length > 0 ? (
          <button onClick={clearChecked} className="text-xs text-text-subtle hover:text-text">
            {t("clearChecked")}
          </button>
        ) : null
      }
    >
      <div className="flex h-full flex-col">
        <ul className="flex-1 space-y-0.5">
          {items.length === 0 ? (
            <EmptyState>{t("empty")}</EmptyState>
          ) : (
            items.map((item) => (
              <li key={item.id} className="group flex items-center gap-3 rounded-lg px-1.5 py-1.5">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggle(item)}
                  className="h-5 w-5 shrink-0 accent-[var(--accent)]"
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    item.checked && "text-text-subtle line-through",
                  )}
                >
                  {item.name}
                  {item.quantity ? (
                    <span className="text-text-subtle"> · {item.quantity}</span>
                  ) : null}
                </span>
                <button
                  onClick={() => remove(item)}
                  className="shrink-0 text-text-subtle opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  aria-label="ta bort"
                >
                  <X size={16} />
                </button>
              </li>
            ))
          )}
        </ul>

        <form onSubmit={add} className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("placeholder")}
            className={inputClass()}
          />
          <Button type="submit" variant="primary" aria-label={t("placeholder")}>
            <Plus size={16} />
          </Button>
        </form>
      </div>
    </WidgetFrame>
  );
}
