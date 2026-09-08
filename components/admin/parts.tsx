"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { cn } from "../ui";

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold">{children}</h1>
      {sub ? <p className="mt-1 text-sm text-text-subtle">{sub}</p> : null}
    </div>
  );
}

export function ListCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("card divide-y divide-border p-0", className)}>{children}</div>;
}

export function ListRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center gap-3 px-4 py-3", className)}>{children}</div>;
}

export function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const t = useTranslations("admin");
  return (
    <button
      onClick={() => {
        if (confirm(t("confirmDelete"))) onConfirm();
      }}
      className="shrink-0 rounded-lg p-2 text-text-subtle transition-colors hover:bg-danger/10 hover:text-danger"
      aria-label={t("nav.overview")}
    >
      <Trash2 size={16} />
    </button>
  );
}
