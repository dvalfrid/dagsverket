"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Users,
  MonitorSmartphone,
  SquareStack,
  ListChecks,
  CalendarDays,
  UtensilsCrossed,
  Settings2,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { apiFetch } from "@/lib/useLiveData";
import { cn } from "../ui";

const NAV: {
  href: string;
  key: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}[] = [
  { href: "/admin", key: "overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/people", key: "people", icon: Users },
  { href: "/admin/devices", key: "devices", icon: MonitorSmartphone },
  { href: "/admin/profiles", key: "profiles", icon: SquareStack },
  { href: "/admin/chores", key: "chores", icon: ListChecks },
  { href: "/admin/calendar", key: "calendar", icon: CalendarDays },
  { href: "/admin/meals", key: "meals", icon: UtensilsCrossed },
  { href: "/admin/settings", key: "settings", icon: Settings2 },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname.endsWith(href) : pathname.includes(href);

  async function logout() {
    await apiFetch("/api/admin/session", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div data-theme="dark" className="flex min-h-screen bg-bg text-text">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface/50 p-3">
        <div className="px-3 py-3">
          <p className="text-sm font-semibold">Dagsverket</p>
          <p className="text-xs text-text-subtle">{t("title")}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map(({ href, key, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                isActive(href, exact)
                  ? "bg-accent-soft text-accent"
                  : "text-text-muted hover:bg-surface-hover hover:text-text",
              )}
            >
              <Icon size={17} />
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-0.5 border-t border-border pt-2">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <ArrowLeft size={17} />
            {t("backToDashboard")}
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <LogOut size={17} />
            {t("login.logout")}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
