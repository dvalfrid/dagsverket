"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MonitorSmartphone, Loader2 } from "lucide-react";
import { useLiveData } from "@/lib/useLiveData";

type DeviceMe = { paired: false; pairingCode: string; device: { name: string } } | { paired: true };

export function PairScreen() {
  const t = useTranslations("pair");
  const router = useRouter();

  const { data } = useLiveData<DeviceMe>("/api/device/me", {
    refreshInterval: 4000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (data?.paired) router.replace("/");
  }, [data, router]);

  const code = data && !data.paired ? data.pairingCode : null;

  return (
    <div
      data-theme="dark"
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg px-6 text-center text-text"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <MonitorSmartphone size={28} />
        </span>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="max-w-sm text-sm text-text-muted">{t("intro")}</p>
      </div>

      <div className="card flex flex-col items-center gap-2 px-10 py-8">
        <span className="text-xs font-medium uppercase tracking-widest text-text-subtle">
          {t("codeLabel")}
        </span>
        <span className="font-mono text-6xl font-bold tracking-[0.3em] text-text">
          {code ?? "······"}
        </span>
      </div>

      <p className="flex items-center gap-2 text-sm text-text-subtle">
        <Loader2 size={16} className="animate-spin" />
        {data?.paired ? t("paired") : t("waiting")}
      </p>
      <p className="text-xs text-text-subtle">{t("help")}</p>
    </div>
  );
}
