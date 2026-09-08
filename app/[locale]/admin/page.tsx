"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLiveData } from "@/lib/useLiveData";
import { PageTitle } from "@/components/admin/parts";
import { cn } from "@/components/ui";

export default function AdminOverview() {
  const t = useTranslations("admin");
  const { data: people } = useLiveData<unknown[]>("/api/people");
  const { data: profiles } = useLiveData<unknown[]>("/api/profiles");
  const { data: devices } = useLiveData<{ pending: unknown[]; paired: unknown[] }>("/api/devices");
  const { data: feeds } = useLiveData<unknown[]>("/api/calendar/feeds");

  const stats = [
    { key: "people", href: "/admin/people", value: people?.length },
    { key: "profiles", href: "/admin/profiles", value: profiles?.length },
    {
      key: "devices",
      href: "/admin/devices",
      value: devices ? `${devices.paired.length} / ${devices.pending.length}` : undefined,
    },
    { key: "calendar", href: "/admin/calendar", value: feeds?.length },
  ] as const;

  return (
    <>
      <PageTitle sub="Dagsverket">{t("nav.overview")}</PageTitle>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            className="card p-5 transition-colors hover:bg-surface-hover"
          >
            <p className="text-xs uppercase tracking-wide text-text-subtle">
              {t(`nav.${s.key}`)}
            </p>
            <p className={cn("mt-2 text-3xl font-semibold tabular-nums")}>
              {s.value ?? "–"}
            </p>
          </Link>
        ))}
      </div>
      {devices && devices.pending.length > 0 ? (
        <Link
          href="/admin/devices"
          className="mt-4 block rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-accent"
        >
          {devices.pending.length} {t("devices.pending").toLowerCase()} →
        </Link>
      ) : null}
    </>
  );
}
