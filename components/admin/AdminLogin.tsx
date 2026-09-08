"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { apiFetch, ApiError } from "@/lib/useLiveData";
import { Button, Field, inputClass } from "../ui";

export function AdminLogin() {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      await apiFetch("/api/admin/session", { json: { pin } });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError);
      setBusy(false);
    }
  }

  return (
    <div
      data-theme="dark"
      className="flex min-h-screen items-center justify-center bg-bg px-6 text-text"
    >
      <form onSubmit={submit} className="card w-full max-w-sm space-y-5 p-7">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <Field label={t("pinLabel")}>
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className={inputClass("text-lg tracking-[0.4em]")}
          />
        </Field>
        {error ? <p className="text-sm text-danger">{t("wrong")}</p> : null}
        <Button type="submit" variant="primary" className="w-full" disabled={busy || !pin}>
          {t("submit")}
        </Button>
      </form>
    </div>
  );
}
