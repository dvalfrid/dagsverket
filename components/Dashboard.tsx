"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Settings, WifiOff } from "lucide-react";
import { useLiveData } from "@/lib/useLiveData";
import type { WidgetConfig } from "@/lib/widgets";
import { DashboardGrid } from "./DashboardGrid";

export interface DashboardProfile {
  id: string;
  name: string;
  type: "admin" | "family" | "child";
  locale: string | null;
  theme: "dark" | "light";
  person: { id: string; name: string; color: string; avatarEmoji: string } | null;
  widgets: WidgetConfig[];
}

export interface DashboardData {
  device: { id: string; name: string };
  profile: DashboardProfile;
}

type DeviceMe =
  | { paired: false; pairingCode: string }
  | { paired: true; device: DashboardData["device"]; profile: DashboardProfile };

export function Dashboard({ initial }: { initial: DashboardData }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const { data, error } = useLiveData<DeviceMe>("/api/device/me", {
    fallbackData: { paired: true, ...initial },
  });

  const paired = data?.paired !== false;
  const profile = paired && data?.paired ? data.profile : initial.profile;

  // The admin un-paired this device — bounce to the pairing screen.
  useEffect(() => {
    if (data && data.paired === false) router.replace("/pair");
  }, [data, router]);

  // Follow the profile's language preference.
  useEffect(() => {
    if (profile.locale && profile.locale !== locale) {
      router.replace(pathname, { locale: profile.locale });
    }
  }, [profile.locale, locale, pathname, router]);

  const showAdminLink = profile.type !== "child";

  return (
    <div
      data-theme={profile.theme}
      className="flex min-h-screen flex-col bg-bg text-text"
    >
      <header className="flex items-center justify-between px-6 pt-5 pb-3 sm:px-8">
        <div className="flex items-center gap-3">
          {profile.person ? (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: `${profile.person.color}22` }}
            >
              {profile.person.avatarEmoji}
            </span>
          ) : null}
          <div className="leading-tight">
            <p className="text-sm font-semibold">{profile.name}</p>
            <p className="text-xs text-text-subtle">Dagsverket</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-text-subtle">
          {error ? (
            <span className="flex items-center gap-1.5 text-xs text-warning" title={t("offline")}>
              <WifiOff size={16} />
            </span>
          ) : null}
          {showAdminLink ? (
            <Link
              href="/admin"
              className="rounded-lg p-2 transition-colors hover:bg-surface-hover hover:text-text"
              aria-label={t("openAdmin")}
            >
              <Settings size={18} />
            </Link>
          ) : null}
        </div>
      </header>

      <main className="min-h-0 flex-1 px-4 pb-6 sm:px-8">
        <DashboardGrid widgets={profile.widgets} profile={profile} />
      </main>
    </div>
  );
}
